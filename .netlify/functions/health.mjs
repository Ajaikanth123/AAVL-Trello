export default async (req, context) => {
  return new Response(JSON.stringify({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
