import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm';

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;
const region = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region, credentials });
const instanceId = 'i-0113a8711a2f8b53c';

export async function runCommandOnEc2(commands) {
  console.log('Sending commands to EC2 instance:', instanceId);
  const sendRes = await ssm.send(new SendCommandCommand({
    InstanceIds: [instanceId],
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: Array.isArray(commands) ? commands : [commands]
    }
  }));

  const commandId = sendRes.Command.CommandId;
  console.log('Command ID:', commandId);

  // Poll for result
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const inv = await ssm.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      }));

      const status = inv.Status;
      if (['Success', 'Failed', 'Cancelled', 'TimedOut'].includes(status)) {
        console.log(`\n=== Command Result: ${status} (Exit Code: ${inv.ResponseCode}) ===`);
        if (inv.StandardOutputContent) {
          console.log('--- STDOUT ---');
          console.log(inv.StandardOutputContent);
        }
        if (inv.StandardErrorContent) {
          console.log('--- STDERR ---');
          console.log(inv.StandardErrorContent);
        }
        return inv;
      }
    } catch (e) {
      // Waiting for command to register
    }
  }
}

if (process.argv[1]?.endsWith('runSsmCommand.js')) {
  const cmd = process.argv[2] || 'tail -n 50 /var/log/campusbite-setup.log';
  runCommandOnEc2(cmd).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
