import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'no-reply@mail.zbdigital.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}
const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#71717a', MEDIUM: '#3b82f6', HIGH: '#f97316', URGENT: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  TODO: 'A fazer', IN_PROGRESS: 'Em andamento', IN_REVIEW: 'Em revisão',
  DONE: 'Concluída', CANCELLED: 'Cancelada',
}

function base(title: string, preheader: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e4e4e7;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:28px;height:28px;background:#18181b;border:1px solid #27272a;border-radius:7px;text-align:center;vertical-align:middle;">
                <span style="font-size:14px;color:#a78bfa;">⚡</span>
              </td>
              <td style="padding-left:8px;font-size:13px;font-weight:600;color:#d4d4d8;letter-spacing:-0.01em;">ProjectFlow</td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Card -->
      <tr>
        <td style="background:#0f0f11;border:1px solid #27272a;border-radius:14px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding-top:24px;text-align:center;font-size:11px;color:#52525b;line-height:1.6;">
          Este email foi enviado pelo ProjectFlow.<br>
          Em conformidade com a LGPD (Lei nº 13.709/2018).
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function badge(text: string, color: string) {
  return `<span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:${color}18;color:${color};border:1px solid ${color}30;">${text}</span>`
}

function field(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #27272a;">
      <span style="font-size:11px;color:#71717a;display:block;margin-bottom:2px;">${label}</span>
      <span style="font-size:13px;color:#d4d4d8;">${value}</span>
    </td>
  </tr>`
}

function button(text: string, href: string, color = '#7c3aed') {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:11px 24px;background:${color};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:9px;letter-spacing:-0.01em;">${text}</a>`
}

// ─── Email: Task created (to requester) ──────────────────────────────────────

export async function sendTaskCreatedEmail({
  taskId,
  taskTitle,
  projectName,
  orgName,
  priority,
  requesterName,
  requesterEmail,
}: {
  taskId: string
  taskTitle: string
  projectName: string
  orgName: string
  priority: string
  requesterName?: string | null
  requesterEmail: string
}) {
  const shortId = taskId.slice(-8).toUpperCase()
  const prioColor = PRIORITY_COLOR[priority] ?? '#3b82f6'
  const prioLabel = PRIORITY_LABEL[priority] ?? priority

  const html = base(
    `Solicitação recebida — ${taskTitle}`,
    `Sua solicitação #${shortId} foi registrada e em breve será atendida.`,
    `<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">Solicitação recebida ✓</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;line-height:1.6;">
      ${requesterName ? `Olá, <strong style="color:#d4d4d8;">${requesterName}</strong>! ` : ''}Sua solicitação foi registrada com sucesso e em breve será atendida pela equipe de <strong style="color:#d4d4d8;">${orgName}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${field('Título', taskTitle)}
      ${field('Projeto', projectName)}
      ${field('Prioridade', `<span style="color:${prioColor};font-weight:600;">${prioLabel}</span>`)}
      <tr><td style="padding:8px 0;">
        <span style="font-size:11px;color:#71717a;display:block;margin-bottom:4px;">ID da solicitação</span>
        <code style="font-size:12px;color:#a78bfa;background:#1c1917;padding:3px 8px;border-radius:5px;font-family:monospace;">#${shortId}</code>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#52525b;margin:16px 0 0;line-height:1.6;">Guarde o ID acima para acompanhar o status da sua solicitação. Você será notificado por email quando ela for concluída.</p>`
  )

  try {
    await resend.emails.send({
      from: `${orgName} via ProjectFlow <${FROM}>`,
      to: requesterEmail,
      subject: `[#${shortId}] Solicitação recebida: ${taskTitle}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendTaskCreatedEmail:', err)
  }
}

// ─── Email: Task assigned (to assignee) ─────────────────────────────────────

export async function sendTaskAssignedEmail({
  taskId,
  taskTitle,
  taskDescription,
  projectName,
  orgName,
  priority,
  assigneeName,
  assigneeEmail,
  requesterName,
}: {
  taskId: string
  taskTitle: string
  taskDescription?: string | null
  projectName: string
  orgName: string
  priority: string
  assigneeName: string
  assigneeEmail: string
  requesterName?: string | null
}) {
  const shortId = taskId.slice(-8).toUpperCase()
  const prioColor = PRIORITY_COLOR[priority] ?? '#3b82f6'
  const prioLabel = PRIORITY_LABEL[priority] ?? priority
  const taskUrl = `${APP_URL}/dashboard/tasks/${taskId}`

  const html = base(
    `Nova tarefa atribuída: ${taskTitle}`,
    `Uma nova tarefa foi atribuída a você no projeto ${projectName}.`,
    `<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">Nova tarefa para você</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;line-height:1.6;">
      Olá, <strong style="color:#d4d4d8;">${assigneeName}</strong>! Uma nova tarefa foi atribuída a você em <strong style="color:#d4d4d8;">${orgName}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${field('Título', `<strong style="color:#f4f4f5;">${taskTitle}</strong>`)}
      ${field('Projeto', projectName)}
      ${field('Prioridade', `<span style="color:${prioColor};font-weight:600;">${prioLabel}</span>`)}
      ${requesterName ? field('Solicitante', requesterName) : ''}
      ${taskDescription ? field('Descrição', `<span style="color:#a1a1aa;">${taskDescription.slice(0, 300)}${taskDescription.length > 300 ? '…' : ''}</span>`) : ''}
      <tr><td style="padding:8px 0;">
        <span style="font-size:11px;color:#71717a;display:block;margin-bottom:4px;">ID</span>
        <code style="font-size:12px;color:#a78bfa;background:#1c1917;padding:3px 8px;border-radius:5px;font-family:monospace;">#${shortId}</code>
      </td></tr>
    </table>
    ${APP_URL ? button('Ver tarefa no ProjectFlow', taskUrl) : ''}`
  )

  try {
    await resend.emails.send({
      from: `${orgName} via ProjectFlow <${FROM}>`,
      to: assigneeEmail,
      subject: `[#${shortId}] Nova tarefa: ${taskTitle}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendTaskAssignedEmail:', err)
  }
}

// ─── Email: Task completed (to requester) ────────────────────────────────────

export async function sendTaskCompletedEmail({
  taskId,
  taskTitle,
  projectName,
  orgName,
  requesterName,
  requesterEmail,
}: {
  taskId: string
  taskTitle: string
  projectName: string
  orgName: string
  requesterName?: string | null
  requesterEmail: string
}) {
  const shortId = taskId.slice(-8).toUpperCase()

  const html = base(
    `Solicitação concluída: ${taskTitle}`,
    `Sua solicitação #${shortId} foi concluída pela equipe de ${orgName}.`,
    `<div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:#052e16;border:1px solid #14532d;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:26px;">✓</span>
      </div>
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">Solicitação concluída!</h1>
      <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
        ${requesterName ? `<strong style="color:#d4d4d8;">${requesterName}</strong>, a` : 'A'}sua solicitação foi concluída pela equipe de <strong style="color:#d4d4d8;">${orgName}</strong>.
      </p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${field('Solicitação', taskTitle)}
      ${field('Projeto', projectName)}
      <tr><td style="padding:8px 0;">
        <span style="font-size:11px;color:#71717a;display:block;margin-bottom:4px;">ID</span>
        <code style="font-size:12px;color:#a78bfa;background:#1c1917;padding:3px 8px;border-radius:5px;font-family:monospace;">#${shortId}</code>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#52525b;margin:20px 0 0;line-height:1.6;text-align:center;">Obrigado por entrar em contato. Se precisar de mais ajuda, fique à vontade para abrir uma nova solicitação.</p>`
  )

  try {
    await resend.emails.send({
      from: `${orgName} via ProjectFlow <${FROM}>`,
      to: requesterEmail,
      subject: `[#${shortId}] Concluído: ${taskTitle}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendTaskCompletedEmail:', err)
  }
}
