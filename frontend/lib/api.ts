const API_BASE = "/api"

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text()
    console.error(`API Error: ${res.status} ${res.statusText}`, text)
    throw new Error(text || `${res.status}: ${res.statusText}`)
  }
  return res.json()
}

/* ---------------- PROJECT ---------------- */

export async function createProject(data: {
  name: string
  email: string
}) {
  const res = await fetch(`${API_BASE}/projects/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handle(res)
}

/* ---------------- POLICIES ---------------- */

export async function getPolicies(projectId: string) {
  try {
    const res = await fetch(
      `${API_BASE}/projects/${projectId}/policies/`
    )
    return handle(res)
  } catch (err) {
    // Fallback: Try direct backend URL if proxy fails (ad blocker might block)
    console.warn("Proxied request failed, trying direct backend URL", err)
    const res = await fetch(
      `http://localhost:8000/api/projects/${projectId}/policies/`
    )
    return handle(res)
  }
}

export async function createPolicy(
  projectId: string,
  data: any
) {
  try {
    const res = await fetch(
      `${API_BASE}/projects/${projectId}/policies/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    return handle(res)
  } catch (err) {
    // Fallback: Try direct backend URL if proxy fails (ad blocker might block)
    console.warn("Proxied request failed, trying direct backend URL", err)
    const res = await fetch(
      `http://localhost:8000/api/projects/${projectId}/policies/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    return handle(res)
  }
}

/* ---------------- ALERTS ---------------- */

export async function getAlerts(projectId: string) {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/alerts/`
  )
  return handle(res)
}

/* ---------------- METRICS ---------------- */

export async function getRawMetrics(projectId: string) {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/metrics/`
  )
  return handle(res)
}

export async function getAggregatedMetrics(
  projectId: string,
  bucket: string
) {
  const res = await fetch(
    `${API_BASE}/projects/${projectId}/metrics/aggregated/?bucket=${bucket}`
  )
  return handle(res)
}