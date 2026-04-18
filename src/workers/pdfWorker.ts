import * as pdfjsLib from 'pdfjs-dist';

// Import the worker URL to let Vite handle it
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

self.onmessage = async (e: MessageEvent) => {
  const { fileData, type } = e.data;

  if (type === 'PARSE_PDF') {
    try {
      // fileData is expected to be an ArrayBuffer
      const loadingTask = pdfjsLib.getDocument({ data: fileData });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdf.numPages;

      // Extract text page by page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText + '\n';
        
        // Report progress back to main thread
        self.postMessage({ type: 'PROGRESS', progress: Math.round((i / numPages) * 100) });
      }

      self.postMessage({ type: 'SUCCESS', text: fullText });
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', error: error.message || 'Failed to parse PDF' });
    }
  }
};
