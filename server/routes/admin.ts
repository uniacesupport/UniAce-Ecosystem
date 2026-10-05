import express from 'express';
import admin from 'firebase-admin';
import { MailService } from '../mailService';
import { GoogleGenAI } from '@google/genai';
import { fetchProviderModels } from '../modelDiscovery';
import { recordBackendSystemLog } from '../memoryMonitor';

export function setupAdminRoutes(app: express.Express, verifyAuth: any, getAdminApp: any, isAdminEmail: any) {

  // 1. Dynamic AI Lesson Remediation Endpoint (For High-Struggle Subtopics)
  app.post('/api/admin/remediate-lesson', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const { courseId, moduleId, subTopicId, subTopicTitle, moduleTitle, struggleCount } = req.body;
      if (!subTopicTitle) {
        return res.status(400).json({ error: 'subTopicTitle is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are UniAce's Senior University Academic Architect & Curriculum Specialist.
Students are actively struggling with the topic: "${subTopicTitle}" in module "${moduleTitle || 'Core Studies'}".
(Logged struggle requests from students: ${struggleCount || 1})

Provide a comprehensive, high-clarity academic remediation package formatted in clean Markdown with LaTeX math notation ($...$ and $$...$$).

Structure your output into these 4 distinct sections:
# 1. Intuitive Conceptual Bridge (ELI5 & Real-World Analogy)
Explain the core mechanism simply without introducing any scientific inaccuracies.

# 2. Rigorous Academic Breakdown & Formal Definition
Provide university-standard proofs, mathematical definitions, and complete theoretical mechanisms using LaTeX ($...$).

# 3. Common Student Pitfalls & Misconceptions
Explicitly list what confuses students and provide clear contrasting examples.

# 4. Check for Understanding (3 Interactive Questions with Explanations)
Include 3 multiple-choice conceptual questions with step-by-step verified explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const remediatedContent = (response.text || '').trim();
      if (!remediatedContent) {
        return res.status(502).json({ error: 'Zero-Fallback Policy: Provider returned empty remediation content' });
      }

      await recordBackendSystemLog(
        'success',
        'ai',
        `Admin remediated high-struggle lesson "${subTopicTitle}" (Module: ${moduleTitle || 'General'})`,
        { subTopicId: subTopicId || null, courseId: courseId || null, moduleId: moduleId || null, struggleCount: struggleCount || 1 },
        { uid: user.uid, email: user.email }
      );

      res.json({
        success: true,
        subTopicTitle,
        remediatedContent,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Lesson Remediation Error:', error);
      await recordBackendSystemLog(
        'error',
        'ai',
        `Lesson remediation failed for "${req.body?.subTopicTitle || 'unknown'}": ${error.message || error}`,
        { error: error.message || String(error) },
        { uid: user?.uid, email: user?.email }
      );
      res.status(500).json({ error: error.message || 'Failed to remediate lesson' });
    }
  });

  // 2. Send Broadcast & Log Endpoint
  app.post('/api/admin/send-broadcast', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const { subject, message, channel, targetAudience, faculty, department } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
      }

      let query: admin.firestore.Query = adminApp.firestore().collection('users');
      if (faculty && faculty !== 'all') {
        query = query.where('faculty', '==', faculty);
      }
      if (department && department !== 'all') {
        query = query.where('department', '==', department);
      }

      const usersSnap = await query.limit(500).get();
      const recipients = usersSnap.docs.map(d => ({
        id: d.id,
        email: d.data().email,
        name: d.data().displayName || d.data().name || 'Student'
      })).filter(u => !!u.email);

      const broadcastRef = await adminApp.firestore().collection('broadcast_history').add({
        subject,
        message,
        channel: channel || 'email_and_app',
        targetAudience: targetAudience || 'All Students',
        faculty: faculty || 'All',
        department: department || 'All',
        recipientCount: recipients.length,
        status: 'completed',
        sentBy: user.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      const batch = adminApp.firestore().batch();
      recipients.slice(0, 400).forEach(recipient => {
        const notifRef = adminApp.firestore().collection('users').doc(recipient.id).collection('notifications').doc();
        batch.set(notifRef, {
          title: subject,
          message,
          type: 'announcement',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();

      await recordBackendSystemLog(
        'success',
        'admin',
        `Dispatched broadcast "${subject}" to ${recipients.length} recipients`,
        { broadcastId: broadcastRef.id, subject, channel: channel || 'email_and_app', recipientCount: recipients.length, faculty: faculty || 'All', department: department || 'All' },
        { uid: user.uid, email: user.email }
      );

      res.json({
        success: true,
        broadcastId: broadcastRef.id,
        recipientCount: recipients.length,
        message: `Broadcast successfully dispatched to ${recipients.length} students`
      });
    } catch (error: any) {
      console.error('Send Broadcast Error:', error);
      res.status(500).json({ error: error.message || 'Failed to dispatch broadcast' });
    }
  });

  // 3. Server-Side AI Provider Benchmark Endpoint (Strict Zero-Fallback Live Probing)
  app.post('/api/admin/benchmark', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const { provider, customEndpoint, customApiKey, customModel } = req.body;
      let status: 'online' | 'degraded' | 'offline' = 'online';
      let latencyMs = 0;
      let modelUsed = '';
      let textSample = '';
      let errorMsg = '';

      const apiKeysDoc = await adminApp.firestore().collection('system_settings').doc('api_keys').get();
      const apiKeysData = apiKeysDoc.data() || {};
      const getConfiguredKey = (prov: string, envKey?: string) => {
        const list = apiKeysData[prov]?.keys?.map((k: any) => k.key).filter(Boolean);
        return (list && list[0]) || envKey || '';
      };

      const targetProvider = (provider || 'gemini_direct').toLowerCase();

      if (targetProvider === 'gemini_direct' || targetProvider === 'gemini') {
        try {
          const apiKey = getConfiguredKey('gemini_direct', process.env.GEMINI_API_KEY);
          if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
          const ai = new GoogleGenAI({ apiKey });
          modelUsed = apiKeysData.gemini_direct?.model || 'gemini-2.5-flash';
          const pStart = Date.now();
          const response = await ai.models.generateContent({
            model: modelUsed,
            contents: 'Respond with one word: Ready.',
          });
          latencyMs = Date.now() - pStart;
          textSample = (response.text || '').trim().slice(0, 50);
          if (!textSample) throw new Error('Empty response from Gemini');
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'groq') {
        try {
          const apiKey = getConfiguredKey('groq', process.env.GROQ_API_KEY);
          if (!apiKey) throw new Error('GROQ_API_KEY not configured');
          modelUsed = apiKeysData.groq?.model || 'llama-3.3-70b-versatile';
          const pStart = Date.now();
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`Groq returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'mistral_direct' || targetProvider === 'mistral') {
        try {
          const apiKey = getConfiguredKey('mistral_direct', process.env.MISTRAL_API_KEY);
          if (!apiKey) throw new Error('MISTRAL_API_KEY not configured');
          modelUsed = apiKeysData.mistral_direct?.model || 'mistral-small-latest';
          const pStart = Date.now();
          const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`Mistral returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'nvidia') {
        try {
          const apiKey = getConfiguredKey('nvidia', process.env.NVIDIA_API_KEY);
          if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');
          modelUsed = apiKeysData.nvidia?.model || 'meta/llama-3.1-70b-instruct';
          const pStart = Date.now();
          const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`NVIDIA returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'openrouter_free' || targetProvider === 'openrouter') {
        try {
          const apiKey = getConfiguredKey('openrouter_free', process.env.OPENROUTER_API_KEY);
          if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
          modelUsed = apiKeysData.openrouter_free?.model || 'meta-llama/llama-3.3-70b-instruct:free';
          const pStart = Date.now();
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`OpenRouter returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'cohere') {
        try {
          const apiKey = getConfiguredKey('cohere', process.env.COHERE_API_KEY);
          if (!apiKey) throw new Error('COHERE_API_KEY not configured');
          modelUsed = apiKeysData.cohere?.model || 'command-r-08-2024';
          const pStart = Date.now();
          const r = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`Cohere returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.message?.content?.[0]?.text || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'huggingface') {
        try {
          const apiKey = getConfiguredKey('huggingface', process.env.HUGGINGFACE_API_KEY);
          if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');
          modelUsed = apiKeysData.huggingface?.model || 'Qwen/Qwen2.5-72B-Instruct';
          const pStart = Date.now();
          const r = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelUsed, messages: [{ role: 'user', content: 'Say Ready' }], max_tokens: 5 })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`HuggingFace returned HTTP ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else if (targetProvider === 'custom' && customEndpoint) {
        try {
          const pStart = Date.now();
          const r = await fetch(customEndpoint, {
            method: 'POST',
            headers: {
              ...(customApiKey ? { 'Authorization': `Bearer ${customApiKey}` } : {}),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: customModel || 'default',
              messages: [{ role: 'user', content: 'Ping' }],
              max_tokens: 5
            })
          });
          latencyMs = Date.now() - pStart;
          if (!r.ok) throw new Error(`Endpoint returned status ${r.status}`);
          const d = await r.json();
          textSample = (d.choices?.[0]?.message?.content || '').trim();
          modelUsed = customModel || 'custom';
        } catch (e: any) {
          status = 'offline';
          errorMsg = e.message;
        }
      } else {
        status = 'offline';
        errorMsg = `Unsupported or unconfigured provider: ${targetProvider}`;
      }

      await recordBackendSystemLog(
        status === 'online' ? 'info' : 'warning',
        'ai',
        `Admin benchmarked provider "${targetProvider}" (${modelUsed || 'N/A'}): ${status.toUpperCase()} (${latencyMs}ms)`,
        { provider: targetProvider, status, latencyMs, model: modelUsed, error: errorMsg || null },
        { uid: user.uid, email: user.email }
      );

      res.json({
        provider: targetProvider,
        status,
        latencyMs,
        latencyFormatted: `${latencyMs}ms`,
        model: modelUsed,
        textSample,
        error: errorMsg || undefined,
        timestamp: Date.now()
      });
    } catch (error: any) {
      console.error('Benchmark Error:', error);
      res.status(500).json({ error: error.message || 'Benchmark probing failed' });
    }
  });

  // 4. Admin Managed Password Reset Link
  app.post('/api/admin/reset-password', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Target email is required' });

      const resetLink = await adminApp.auth().generatePasswordResetLink(email);

      try {
        await MailService.sendDiagnosticTestEmail(email);
      } catch (mailErr) {
        console.warn('Direct email sending skipped:', mailErr);
      }

      await recordBackendSystemLog(
        'warning',
        'admin',
        `Admin initiated password reset for ${email}`,
        { targetEmail: email },
        { uid: user.uid, email: user.email }
      );

      res.json({
        success: true,
        message: `Password reset link generated for ${email}`,
        resetLink
      });
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate password reset' });
    }
  });

  // 5. System Config Endpoints (GET & POST)
  app.get('/api/admin/config', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const configDoc = await adminApp.firestore().collection('system_config').doc('general').get();
      res.json(configDoc.exists ? configDoc.data() : {});
    } catch (error: any) {
      console.error('Fetch System Config Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch system config' });
    }
  });

  app.post('/api/admin/config', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const updates = req.body;
      await adminApp.firestore().collection('system_config').doc('general').set({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.email || user.uid
      }, { merge: true });

      await recordBackendSystemLog(
        'info',
        'admin',
        `Updated general system configuration`,
        { updatedKeys: Object.keys(updates || {}) },
        { uid: user.uid, email: user.email }
      );

      res.json({ success: true, message: 'System config updated successfully' });
    } catch (error: any) {
      console.error('Update System Config Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update system config' });
    }
  });

  // 6. Live AI Provider Model Discovery Endpoint
  app.post('/api/admin/fetch-provider-models', verifyAuth, async (req, res) => {
    const user = (req as any).user;
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(503).json({ error: 'Firebase not initialized' });

    try {
      const userDoc = await adminApp.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin' || isAdminEmail(user.email);
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      const { provider, apiKeyOverride, forceRefresh } = req.body;
      if (!provider) {
        return res.status(400).json({ error: 'Provider name is required' });
      }

      console.log(`[Admin] Discovering live models for provider '${provider}' (forceRefresh: ${!!forceRefresh})...`);
      const { models, cached } = await fetchProviderModels(
        provider,
        apiKeyOverride,
        forceRefresh === true || forceRefresh === 'true'
      );

      await recordBackendSystemLog(
        'info',
        'ai',
        `Discovered ${models.length} live models for provider "${provider}" (cached: ${!!cached})`,
        { provider, count: models.length, cached: !!cached },
        { uid: user.uid, email: user.email }
      );

      res.json({
        success: true,
        provider,
        count: models.length,
        models,
        cached
      });
    } catch (error: any) {
      console.error(`[Admin] Model discovery failed for provider:`, error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch provider models',
        details: error.stack
      });
    }
  });
}




