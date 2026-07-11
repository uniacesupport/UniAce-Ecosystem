#!/bin/bash
sed -i 's/    for (const fallbackName of routeConfig.fallbacks) {/    const dynamicFallbacks = Object.keys(providerMap).filter(p => p !== primaryProviderName \&\& p !== preferredProviderName);\n    dynamicFallbacks.sort(() => Math.random() - 0.5);\n    for (const fallbackName of dynamicFallbacks) {/g' server.ts
sed -i 's/      if (fallbackName !== primaryProviderName && providerMap\[fallbackName\]) {/      if (providerMap[fallbackName]) {/g' server.ts
sed -i 's/      if (fallbackName !== preferredProviderName && providerMap\[fallbackName\]) {/      if (providerMap[fallbackName]) {/g' server.ts
