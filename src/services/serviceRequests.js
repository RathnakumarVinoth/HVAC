export const N8N_WEBHOOK_URL = 'https://hvacleadautomation.app.n8n.cloud/webhook/hvac-lead';

export async function submitServiceRequest(request) {
  const payload = {
    fullName: request.fullName,
    phone: request.phone,
    email: request.email,
    zipCode: request.zip,
    serviceNeeded: request.service,
    problemDescription: request.description,
    preferredDate: request.date,
    preferredTime: request.time,
    source: 'CoolAir HVAC Website',
  };

  console.log('CoolAir HVAC service request payload:', payload);

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('CoolAir HVAC service request HTTP status:', response.status);

  if (!response.ok) {
    throw new Error(`Service request failed: HTTP ${response.status}`);
  }

  return response;
}
