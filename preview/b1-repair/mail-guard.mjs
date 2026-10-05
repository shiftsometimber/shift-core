// Isolated preview transport only. Keep the real application message intact.
export function previewResetSender(env){
 return {async send(message){
  const from=typeof message.from==='string'?message.from:message.from?.email;
  if(message.to!==env.PREVIEW_B1_MAILBOX||message.subject!=='Reset your My Timber password'||from!=='hello@shiftsometimber.co.uk'||message.replyTo!=='support@shiftsometimber.co.uk')throw Error('preview_mail_not_allowed');
  return env.EMAIL.send(message);
 }};
}
