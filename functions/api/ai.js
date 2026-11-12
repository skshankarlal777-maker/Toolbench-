const tools = {
 assistant: "You are a helpful AI assistant.",
 youtube: "You are a professional YouTube strategist.",
 writer: "You are an expert content writer.",
 student: "You are a helpful teacher.",
 business: "You are a business consultant.",
 career: "You are a career coach.",
 developer: "You are a programming expert.",
 translator: "You are a professional translator.",
 design: "You are a creative design consultant."
};

export async function onRequestPost({request,env}) {
 const send = (data,status=200) =>
  new Response(JSON.stringify(data),{
   status,
   headers:{"Content-Type":"application/json"}
  });

 if(!env.GEMINI_API_KEY)
  return send({error:"API key not configured."},503);

 try {
  const body=await request.json();
  const prompt=typeof body.prompt==="string"
   ? body.prompt.trim() : "";
  const tool=body.tool || "assistant";
  const language=body.language || "English";

  if(!tools[tool] || !prompt || prompt.length>6000)
   return send({error:"Invalid tool or prompt."},400);

  const response=await fetch(
   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+
   encodeURIComponent(env.GEMINI_API_KEY),
   {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     systemInstruction:{
      parts:[{text:tools[tool]+" Reply in "+language+
       ". Be accurate and honest."}]
     },
     contents:[{
      role:"user",
      parts:[{text:prompt}]
     }]
    })
   }
  );

  const data=await response.json();

  if(!response.ok)
   return send({error:"AI service unavailable or quota reached."},502);

  const text=(data.candidates?.[0]?.content?.parts||[])
   .map(x=>x.text||"").join("\n");

  return send({text:text || "No response generated."});

 } catch(e) {
  return send({error:"Server connection error."},500);
 }
            }
