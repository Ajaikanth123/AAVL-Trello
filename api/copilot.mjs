export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  console.log(`Received AI Copilot prompt: "${prompt}"`);

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    let tasks = [];
    if (prompt.toLowerCase().includes('marketing') || prompt.toLowerCase().includes('campaign')) {
      tasks = [
        'Research target market demographics',
        'Set up email marketing newsletter templates',
        'Draft launch announcement social copy',
        'Analyze competitors pricing and positioning',
        'Configure tracking pixels and conversion goals'
      ];
    } else if (prompt.toLowerCase().includes('website') || prompt.toLowerCase().includes('landing')) {
      tasks = [
        'Draft website copy and content outline',
        'Design high-fidelity desktop & mobile layouts',
        'Develop responsive frontend codebase',
        'Optimize page speed and image compression',
        'Publish site to production hosting'
      ];
    } else {
      tasks = [
        `Draft objectives for: ${prompt}`,
        'Define key success metrics',
        'Assign task owner and stakeholders',
        'Establish timeline and key milestones',
        'Schedule follow-up review meeting'
      ];
    }

    res.json({
      success: true,
      tasks,
      message: `Generated ${tasks.length} tasks matching your requirements.`
    });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
