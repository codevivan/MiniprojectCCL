import bcrypt from 'bcryptjs';
import { userRepo } from '../repositories/userRepo.js';

async function resetOwnerPassword() {
  const args = process.argv.slice(2);
  const newPassword = args[0] || 'Admin@CampusBite2026';

  console.log('--- Secure Owner Password Reset Utility ---');
  
  const owner = await userRepo.getOwner();
  if (!owner) {
    console.error('Error: No Master Owner account currently exists. Please use /owner/setup in the web UI first.');
    process.exit(1);
  }

  console.log(`Found Master Owner account: ${owner.email} (User ID: ${owner.userId})`);
  
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);

  await userRepo.updatePassword(owner.userId, newHash);

  console.log(`Password for ${owner.email} has been successfully reset!`);
  console.log(`New temporary password: ${newPassword}`);
  console.log('Please log into http://localhost:5175/owner/login and update your credentials.');
  process.exit(0);
}

resetOwnerPassword().catch(err => {
  console.error('Owner reset failed:', err.message);
  process.exit(1);
});
