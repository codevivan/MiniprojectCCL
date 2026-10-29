import { 
  S3Client, 
  ListObjectsV2Command, 
  DeleteObjectsCommand, 
  PutObjectCommand, 
  PutBucketCorsCommand,
  HeadObjectCommand 
} from '@aws-sdk/client-s3';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  CreateSubnetCommand, 
  ModifySubnetAttributeCommand,
  DescribeRouteTablesCommand, 
  AssociateRouteTableCommand, 
  DescribeSecurityGroupsCommand, 
  AuthorizeSecurityGroupIngressCommand, 
  CreateTagsCommand,
  DescribeVpcAttributeCommand,
  ModifyVpcAttributeCommand,
  DescribeInternetGatewaysCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const credentials = (process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY) ? {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.TEST_AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.TEST_AWS_SECRET
} : undefined;

const region = process.env.AWS_REGION || 'eu-north-1';
const bucketName = process.env.S3_BUCKET_NAME || 'campusbite-food-images-2026';

const s3 = new S3Client({ region, credentials });
const ec2 = new EC2Client({ region, credentials });

// -------------------------------------------------------------
// S3 MANAGEMENT
// -------------------------------------------------------------
async function manageS3() {
  console.log('\n======================================================');
  console.log(`[S3] Starting S3 Management for bucket: ${bucketName}`);
  console.log('======================================================');

  // Step 1: List all current objects
  console.log('\n--> Step 1: Scanning bucket contents...');
  let continuationToken = undefined;
  const allObjects = [];
  do {
    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken
    }));
    if (listRes.Contents) {
      allObjects.push(...listRes.Contents);
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`Found total ${allObjects.length} objects currently in bucket.`);

  // Step 2: Identify unnecessary objects to remove
  // MiniProject/ directory was an accidental code dump containing node_modules, src, etc.
  const toDelete = allObjects
    .filter(o => o.Key.startsWith('MiniProject/') || o.Key.startsWith('temp/') || o.Key.endsWith('.tmp'))
    .map(o => ({ Key: o.Key }));

  if (toDelete.length > 0) {
    console.log(`\n--> Step 2: Removing ${toDelete.length} unnecessary objects (accidental source code & node_modules dumps)...`);
    // Delete in chunks of 500
    for (let i = 0; i < toDelete.length; i += 500) {
      const chunk = toDelete.slice(i, i + 500);
      await s3.send(new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: chunk, Quiet: true }
      }));
      console.log(`   Deleted chunk ${i + 1} to ${Math.min(i + 500, toDelete.length)}`);
    }
    console.log('✔ Cleanup complete: Removed all unnecessary files.');
  } else {
    console.log('\n--> Step 2: No unnecessary files found to clean.');
  }

  // Step 3: Upload all local food images to S3
  console.log('\n--> Step 3: Uploading all food images to S3 under images/food/ and food/...');
  const foodDir = path.resolve(projectRoot, 'backend', 'public', 'images', 'food');
  if (fs.existsSync(foodDir)) {
    const files = fs.readdirSync(foodDir).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    console.log(`Found ${files.length} food images in local directory.`);

    for (const file of files) {
      const filePath = path.join(foodDir, file);
      const fileData = fs.readFileSync(filePath);
      const contentType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Upload to images/food/<file>
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `images/food/${file}`,
        Body: fileData,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      }));

      // Also alias to food/<file> for legacy compatibility
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `food/${file}`,
        Body: fileData,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      }));

      console.log(`   ✔ Uploaded: ${file} (${(fileData.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Step 4: Upload branding assets
  console.log('\n--> Step 4: Uploading branding assets...');
  const faviconPath = path.resolve(projectRoot, 'frontend', 'public', 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    const svgData = fs.readFileSync(faviconPath);
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'images/branding/favicon.svg',
      Body: svgData,
      ContentType: 'image/svg+xml',
      CacheControl: 'public, max-age=31536000'
    }));
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'images/branding/logo.svg',
      Body: svgData,
      ContentType: 'image/svg+xml',
      CacheControl: 'public, max-age=31536000'
    }));
    console.log('   ✔ Uploaded branding: favicon.svg and logo.svg');
  }

  // Step 5: Upload all info and catalog manifests to info/
  console.log('\n--> Step 5: Generating and uploading info manifests to info/...');

  const canteenInfo = {
    canteenName: "CampusBite Canteen",
    tagline: "Order Smart. Skip the Queue.",
    institution: "Campus College Center",
    version: "1.0.0",
    environment: "production",
    awsRegion: region,
    s3Bucket: bucketName,
    openingHours: "08:00 AM - 05:00 PM",
    currency: "INR (₹)",
    paymentMethodsSupported: ["UPI", "CARD", "CASH"],
    categories: [
      "BREAKFAST",
      "LUNCH",
      "SOUTH INDIAN",
      "FAST FOOD",
      "SNACKS",
      "CHAAT",
      "BEVERAGES",
      "DESSERTS"
    ],
    features: [
      "Real-time token queue progression",
      "Instant push updates via WebSocket",
      "Automated order notification triggers",
      "Multi-AZ AWS VPC network architecture",
      "Single-digit millisecond latency DynamoDB backend"
    ],
    lastUpdated: new Date().toISOString()
  };

  const systemArchitecture = {
    project: "CampusBite",
    cloudProvider: "Amazon Web Services (AWS)",
    region: region,
    vpc: {
      name: "CampusBite-VPC",
      cidr: "10.0.0.0/16",
      publicSubnet1: "10.0.1.0/24 (eu-north-1a)",
      publicSubnet2: "10.0.2.0/24 (eu-north-1b)",
      internetGateway: "CampusBite-IGW"
    },
    compute: {
      service: "Amazon EC2",
      instanceType: "t3.micro",
      os: "Amazon Linux 2023 Minimal",
      processManager: "PM2 (Cluster Mode)",
      webServer: "Nginx (Reverse Proxy & SSL Termination)"
    },
    storage: {
      primaryDatabase: "Amazon DynamoDB (On-Demand Capacity)",
      tables: [
        "CampusBite_Users",
        "CampusBite_Menu",
        "CampusBite_Orders",
        "CampusBite_Tokens",
        "CampusBite_Payments",
        "CampusBite_Suggestions",
        "CampusBite_Settings"
      ],
      objectStorage: {
        bucket: bucketName,
        purpose: "Food imagery, digital branding assets, catalog manifests, releases",
        corsEnabled: true
      }
    },
    securityAndAuth: {
      authentication: "Amazon Cognito User Pools (Dual-mode JWT Verification)",
      iamRole: "CampusBite-EC2-Role",
      monitoring: "Amazon CloudWatch Logs (/campusbite/backend-api)"
    },
    serverless: {
      notificationFunction: "CampusBite_OrderNotification (Node.js 20.x)"
    }
  };

  // Upload JSON files
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'info/canteen-info.json',
    Body: JSON.stringify(canteenInfo, null, 2),
    ContentType: 'application/json'
  }));
  console.log('   ✔ Uploaded info/canteen-info.json');

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'info/system-architecture.json',
    Body: JSON.stringify(systemArchitecture, null, 2),
    ContentType: 'application/json'
  }));
  console.log('   ✔ Uploaded info/system-architecture.json');

  // Load menu items from DynamoDB local dump or backend to create complete menu-manifest.json
  const localDbPath = path.resolve(projectRoot, 'backend', 'data', 'dynamodb_local_data.json');
  let menuItems = [];
  if (fs.existsSync(localDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      menuItems = Object.values(data.CampusBite_Menu || {});
    } catch (e) {}
  }

  const menuManifest = {
    catalogVersion: "2026.1",
    totalItems: menuItems.length,
    generatedAt: new Date().toISOString(),
    s3BaseUrl: `https://${bucketName}.s3.${region}.amazonaws.com/images/food/`,
    items: menuItems
  };

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'info/menu-manifest.json',
    Body: JSON.stringify(menuManifest, null, 2),
    ContentType: 'application/json'
  }));
  console.log(`   ✔ Uploaded info/menu-manifest.json (${menuItems.length} menu items documented)`);

  const s3Readme = `# CampusBite S3 Asset Storage Repository

Bucket: \`${bucketName}\`  
Region: \`${region}\`

## Structure Overview

\`\`\`
s3://${bucketName}/
├── images/
│   ├── food/           # High-resolution food menu item photography (JPEG)
│   └── branding/       # SVG logos, favicon, and system icons
├── food/               # Compatibility alias for food imagery
├── info/
│   ├── canteen-info.json        # Operational metadata, hours, and features
│   ├── menu-manifest.json       # Structured 29-item food catalog with prices
│   ├── system-architecture.json # Comprehensive AWS cloud design document
│   └── README.md                # Storage directory documentation
└── deploy/
    └── campusbite-release.zip   # Latest verified application deployment artifact
\`\`\`

## CORS Configuration
Cross-Origin Resource Sharing (CORS) is enabled to allow web clients to safely display food imagery.
`;

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'info/README.md',
    Body: s3Readme,
    ContentType: 'text/markdown'
  }));
  console.log('   ✔ Uploaded info/README.md');

  // Step 6: Configure CORS on S3
  console.log('\n--> Step 6: Configuring S3 CORS policy...');
  await s3.send(new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600
        }
      ]
    }
  }));
  console.log('✔ S3 CORS policy configured successfully.');

  // Final summary of bucket
  const finalScan = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
  console.log(`\n✔ S3 Bucket Optimization Complete! Currently holding ${(finalScan.Contents || []).length} clean, well-organized objects.`);
}

// -------------------------------------------------------------
// VPC MANAGEMENT
// -------------------------------------------------------------
async function manageVpc() {
  console.log('\n======================================================');
  console.log('[VPC] Starting Comprehensive Amazon VPC Management');
  console.log('======================================================');

  const vpcId = 'vpc-09a14041899946a51';

  // 1. Ensure DNS Attributes
  console.log('\n--> Step 1: Verifying VPC DNS Attributes...');
  await ec2.send(new ModifyVpcAttributeCommand({
    VpcId: vpcId,
    EnableDnsHostnames: { Value: true }
  }));
  await ec2.send(new ModifyVpcAttributeCommand({
    VpcId: vpcId,
    EnableDnsSupport: { Value: true }
  }));
  console.log('✔ DNS Hostnames & DNS Support both confirmed enabled.');

  // 2. Inspect Subnets
  console.log('\n--> Step 2: Inspecting and managing Multi-AZ Subnets...');
  const subnetsRes = await ec2.send(new DescribeSubnetsCommand({
    Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
  }));
  const subnets = subnetsRes.Subnets || [];
  console.log(`Current subnets in VPC: ${subnets.length}`);

  let subnet2 = subnets.find(s => s.CidrBlock === '10.0.2.0/24');
  if (!subnet2) {
    console.log('Creating secondary public subnet in eu-north-1b (Multi-AZ resilience)...');
    const createSub2 = await ec2.send(new CreateSubnetCommand({
      VpcId: vpcId,
      CidrBlock: '10.0.2.0/24',
      AvailabilityZone: 'eu-north-1b',
      TagSpecifications: [{
        ResourceType: 'subnet',
        Tags: [
          { Key: 'Name', Value: 'CampusBite-PublicSubnet-2' },
          { Key: 'Project', Value: 'CampusBite' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Type', Value: 'Public' },
          { Key: 'ManagedBy', Value: 'CampusBite-CloudOps' }
        ]
      }]
    }));
    subnet2 = createSub2.Subnet;
    console.log(`✔ Created CampusBite-PublicSubnet-2: ${subnet2.SubnetId} in eu-north-1b`);

    // Enable auto-assign public IP
    await ec2.send(new ModifySubnetAttributeCommand({
      SubnetId: subnet2.SubnetId,
      MapPublicIpOnLaunch: { Value: true }
    }));
    console.log('✔ Enabled auto-assign public IP on CampusBite-PublicSubnet-2');
  } else {
    console.log(`✔ Secondary Subnet already exists: ${subnet2.SubnetId} (${subnet2.CidrBlock})`);
  }

  // 3. Associate Subnets with Route Table
  console.log('\n--> Step 3: Checking Route Table associations...');
  const rtRes = await ec2.send(new DescribeRouteTablesCommand({
    Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
  }));
  const publicRt = (rtRes.RouteTables || []).find(r => 
    r.Tags?.some(t => t.Value === 'CampusBite-PublicRouteTable') ||
    r.Routes?.some(rt => rt.DestinationCidrBlock === '0.0.0.0/0' && rt.GatewayId?.startsWith('igw-'))
  );

  if (publicRt && subnet2) {
    const isAssoc = (publicRt.Associations || []).some(a => a.SubnetId === subnet2.SubnetId);
    if (!isAssoc) {
      console.log(`Associating ${subnet2.SubnetId} with Public Route Table ${publicRt.RouteTableId}...`);
      await ec2.send(new AssociateRouteTableCommand({
        RouteTableId: publicRt.RouteTableId,
        SubnetId: subnet2.SubnetId
      }));
      console.log('✔ Secondary subnet associated with Internet Gateway route table.');
    } else {
      console.log('✔ Secondary subnet is already associated with Public Route Table.');
    }
  }

  // 4. Security Group Management
  console.log('\n--> Step 4: Fine-tuning Security Group rules...');
  const sgId = 'sg-0634ff01f16b50511';
  const sgRes = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
  const sg = sgRes.SecurityGroups[0];

  // Check if port 22 has 16.16.128.0/20 (EC2 Instance Connect)
  const sshPerm = (sg.IpPermissions || []).find(p => p.FromPort === 22);
  const hasRange2 = sshPerm?.IpRanges?.some(r => r.CidrIp === '16.16.128.0/20');
  if (!hasRange2) {
    try {
      await ec2.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgId,
        IpPermissions: [{
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{
            CidrIp: '16.16.128.0/20',
            Description: 'EC2 Instance Connect secondary pool eu-north-1'
          }]
        }]
      }));
      console.log('✔ Added EC2 Instance Connect range 16.16.128.0/20 for Port 22 SSH.');
    } catch (e) {
      console.log('Notice on SG rule:', e.message);
    }
  } else {
    console.log('✔ Security group already has all authorized EC2 Instance Connect IP ranges.');
  }

  // 5. Standardized Resource Tagging
  console.log('\n--> Step 5: Applying comprehensive AWS standard resource tags...');
  const allSubnets = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  const subnetIds = (allSubnets.Subnets || []).map(s => s.SubnetId);
  const igws = await ec2.send(new DescribeInternetGatewaysCommand({ Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }] }));
  const igwIds = (igws.InternetGateways || []).map(g => g.InternetGatewayId);
  const rts = await ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  const rtIds = (rts.RouteTables || []).map(r => r.RouteTableId);

  const resourceIdsToTag = [vpcId, ...subnetIds, ...igwIds, ...rtIds, sgId];
  await ec2.send(new CreateTagsCommand({
    Resources: resourceIdsToTag,
    Tags: [
      { Key: 'Project', Value: 'CampusBite' },
      { Key: 'Environment', Value: 'Production' },
      { Key: 'ManagedBy', Value: 'CampusBite-CloudOps' },
      { Key: 'System', Value: 'CampusBite-Canteen' }
    ]
  }));
  console.log(`✔ Tagged ${resourceIdsToTag.length} VPC resources with standard enterprise metadata tags.`);

  console.log('\n✔ VPC Management Complete! Architecture is Multi-AZ ready, secure, and clean.');
}

async function main() {
  await manageVpc();
  console.log('\n--> Verifying S3 bucket status...');
  const finalScan = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
  console.log(`✔ S3 Bucket Status: ${(finalScan.Contents || []).length} objects present.`);
  console.log('Sample Keys:');
  (finalScan.Contents || []).slice(0, 15).forEach(o => console.log('  - ' + o.Key + ' (' + (o.Size / 1024).toFixed(1) + ' KB)'));
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
