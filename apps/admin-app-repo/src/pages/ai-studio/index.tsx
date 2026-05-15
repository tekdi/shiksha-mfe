import React, { useState } from 'react';
const gateway = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:8000';
export default function AiStudioPage() {
  const [title, setTitle] = useState('Micro lesson');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState<any>(null);
  async function generate() {
    const response = await fetch(`${gateway}/api/v1/lessons/generate`, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({title, source_text: sourceText})});
    setResult(await response.json());
  }
  return <main style={{padding:24,maxWidth:760}}><h1>AI Micro-Learning Studio</h1><input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',marginBottom:12}}/><textarea value={sourceText} onChange={e=>setSourceText(e.target.value)} rows={10} style={{width:'100%'}}/><button onClick={generate}>Generate draft lesson</button>{result && <pre>{JSON.stringify(result,null,2)}</pre>}</main>;
}
