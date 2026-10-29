import { 
  EC2Client, 
  CreateVpcCommand, 
  CreateSubnetCommand, 
  CreateInternetGatewayCommand, 
  AttachInternetGatewayCommand, 
  CreateRouteTableCommand, 
  CreateRouteCommand, 
  AssociateRouteTableCommand, 
  ModifyVpcAttributeCommand, 
  ModifySubnetAttributeCommand,
  CreateSecurityGroupCommand, 
  AuthorizeSecurityGroupIngressCommand,
  CreateTagsCommand
} from '@aws-sdk/client-ec2';

const credentials = {
  accessKeyId: process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.TEST_AWS_SECRET
};
const region = 'eu-north-1';
const ec2 = new EC2Client({ region, credentials });

async function setupVpc() {
  console.log('=== Provisioning Custom Amazon VPC for CampusBite ===');

  try {
    // 1. Create VPC (10.0.0.0/16)
    const vpcRes = await ec2.send(new CreateVpcCommand({
      CidrBlock: '10.0.0.0/16'
    }));
    const vpcId = vpcRes.Vpc.VpcId;
    console.log('[VPC] Created VPC:', vpcId);

    await ec2.send(new CreateTagsCommand({
      Resources: [vpcId],
      Tags: [{ Key: 'Name', Value: 'CampusBite-VPC' }]
    }));

    // Enable DNS Hostnames & Resolution
    await ec2.send(new ModifyVpcAttributeCommand({
      VpcId: vpcId,
      EnableDnsHostnames: { Value: true }
    }));
    await ec2.send(new ModifyVpcAttributeCommand({
      VpcId: vpcId,
      EnableDnsSupport: { Value: true }
    }));
    console.log('[VPC] Enabled DNS resolution and hostnames.');

    // 2. Create Internet Gateway
    const igwRes = await ec2.send(new CreateInternetGatewayCommand({}));
    const igwId = igwRes.InternetGateway.InternetGatewayId;
    console.log('[VPC] Created Internet Gateway:', igwId);

    await ec2.send(new CreateTagsCommand({
      Resources: [igwId],
      Tags: [{ Key: 'Name', Value: 'CampusBite-IGW' }]
    }));

    await ec2.send(new AttachInternetGatewayCommand({
      InternetGatewayId: igwId,
      VpcId: vpcId
    }));
    console.log('[VPC] Attached IGW to VPC.');

    // 3. Create Public Subnet (10.0.1.0/24 in eu-north-1a)
    const subnetRes = await ec2.send(new CreateSubnetCommand({
      VpcId: vpcId,
      CidrBlock: '10.0.1.0/24',
      AvailabilityZone: 'eu-north-1a'
    }));
    const subnetId = subnetRes.Subnet.SubnetId;
    console.log('[VPC] Created Public Subnet:', subnetId);

    await ec2.send(new CreateTagsCommand({
      Resources: [subnetId],
      Tags: [{ Key: 'Name', Value: 'CampusBite-PublicSubnet-1' }]
    }));

    await ec2.send(new ModifySubnetAttributeCommand({
      SubnetId: subnetId,
      MapPublicIpOnLaunch: { Value: true }
    }));
    console.log('[VPC] Enabled auto-assign public IPv4 on subnet.');

    // 4. Create Route Table & default route to IGW
    const rtRes = await ec2.send(new CreateRouteTableCommand({
      VpcId: vpcId
    }));
    const rtId = rtRes.RouteTable.RouteTableId;
    console.log('[VPC] Created Route Table:', rtId);

    await ec2.send(new CreateTagsCommand({
      Resources: [rtId],
      Tags: [{ Key: 'Name', Value: 'CampusBite-PublicRouteTable' }]
    }));

    await ec2.send(new CreateRouteCommand({
      RouteTableId: rtId,
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: igwId
    }));
    console.log('[VPC] Added 0.0.0.0/0 route via IGW.');

    await ec2.send(new AssociateRouteTableCommand({
      RouteTableId: rtId,
      SubnetId: subnetId
    }));
    console.log('[VPC] Associated Route Table with Public Subnet.');

    // 5. Create Security Group
    const sgRes = await ec2.send(new CreateSecurityGroupCommand({
      GroupName: 'CampusBite-EC2-SecurityGroup',
      Description: 'Security Group for CampusBite EC2 web and backend traffic',
      VpcId: vpcId
    }));
    const sgId = sgRes.GroupId;
    console.log('[VPC] Created Security Group:', sgId);

    await ec2.send(new CreateTagsCommand({
      Resources: [sgId],
      Tags: [{ Key: 'Name', Value: 'CampusBite-EC2-SG' }]
    }));

    // Ingress rules: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5050 (CampusBite API)
    await ec2.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: sgId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTP web traffic' }]
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTPS secure web traffic' }]
        },
        {
          IpProtocol: 'tcp',
          FromPort: 5050,
          ToPort: 5050,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'CampusBite Node.js API direct port' }]
        },
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'SSH & EC2 Instance Connect administration' }]
        }
      ]
    }));
    console.log('[VPC] Configured ingress rules for ports 22, 80, 443, and 5050.');

    console.log('\n--- Custom VPC Provisioning Summary ---');
    console.log('VPC_ID=' + vpcId);
    console.log('SUBNET_ID=' + subnetId);
    console.log('SECURITY_GROUP_ID=' + sgId);
  } catch (err) {
    console.error('[VPC Setup Error]', err.name, err.message);
  }
}

setupVpc();
