import { 
  CognitoIdentityProviderClient, 
  CreateUserPoolCommand, 
  CreateUserPoolClientCommand,
  DescribeUserPoolCommand
} from '@aws-sdk/client-cognito-identity-provider';

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';
const client = new CognitoIdentityProviderClient({ region, credentials });

async function setupCognito() {
  console.log('=== Provisioning Amazon Cognito for CampusBite ===');

  try {
    const poolRes = await client.send(new CreateUserPoolCommand({
      PoolName: 'CampusBite_UserPool',
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: false,
          RequireLowercase: false,
          RequireNumbers: true,
          RequireSymbols: false
        }
      },
      Schema: [
        {
          Name: 'role',
          AttributeDataType: 'String',
          Mutable: true
        },
        {
          Name: 'studentId',
          AttributeDataType: 'String',
          Mutable: true
        }
      ]
    }));

    const poolId = poolRes.UserPool.Id;
    console.log('[Cognito] User Pool created:', poolId);

    // Create App Client (No client secret for public SPA web client)
    const clientRes = await client.send(new CreateUserPoolClientCommand({
      UserPoolId: poolId,
      ClientName: 'CampusBite_WebClient',
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH'
      ]
    }));

    const clientId = clientRes.UserPoolClient.ClientId;
    console.log('[Cognito] User Pool Client created:', clientId);
    console.log('\n--- Cognito Setup Complete ---');
    console.log('COGNITO_USER_POOL_ID=' + poolId);
    console.log('COGNITO_CLIENT_ID=' + clientId);
  } catch (err) {
    console.error('[Cognito Setup Error]', err.name, err.message);
  }
}

setupCognito();
