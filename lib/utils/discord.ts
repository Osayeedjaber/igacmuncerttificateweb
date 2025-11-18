export async function sendDiscordNotification(message: string) {
  const webhookUrl = process.env.DISCORD_ERRORS_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch {
    // Swallow errors so Discord issues don't break the main flow
  }
}
