// src/lib/tracker.ts

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface EmbedImage {
  url: string;
}

interface Embed {
  title: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  timestamp?: string;
  image?: EmbedImage;
}

interface WebhookPayload {
  embeds: Embed[];
}

const webhookUrl = 'https://discord.com/api/webhooks/1440385884347301940/Il1R2jtUo38NQofvuET7P2tIxR41nNWrkjqUJxP4ziKCZnPeT_6jyRSmQzJIqe4m77q4';

/**
 * Sends an activity log to a Discord webhook.
 * @param title The title of the embed message.
 * @param description A description for the embed.
 * @param fields An array of fields to include in the embed.
 * @param imageUrl An optional URL for an image to include in the embed.
 */
export async function trackActivity(
    title: string,
    description?: string,
    fields?: EmbedField[],
    imageUrl?: string
) {
    try {
        const embed: Embed = {
            title,
            description,
            color: 0x0099ff, // Blue color
            timestamp: new Date().toISOString(),
            fields: fields || [],
        };

        if (imageUrl) {
            // Discord has caching issues, appending a timestamp helps
            embed.image = { url: `${imageUrl}?t=${Date.now()}` };
            if (fields) {
                embed.fields.push({ name: "Attachment", value: "See image below." });
            }
        }
        
        const payload: WebhookPayload = {
            embeds: [embed],
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error('Error sending to Discord webhook:', error);
    }
}
