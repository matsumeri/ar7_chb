import Head from 'next/head';

export default function Home() {
  return (
    <div style={{fontFamily: 'Arial, sans-serif', padding: 20}}>
      <Head>
        <title>ar7chatbot - Demo</title>
      </Head>
      <h1>ar7chatbot — Demo</h1>
      <p>Chatbot de captura de clientes para WhatsApp Business (scaffold).</p>
      <p>Use el endpoint <code>/api/webhook</code> para recibir mensajes desde su proveedor de WhatsApp.</p>
      <p><a href="/admin">Ir al panel admin (ejemplo)</a></p>
    </div>
  );
}
