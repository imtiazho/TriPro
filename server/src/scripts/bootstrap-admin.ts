import { connectDatabase, disconnectDatabase } from '../config/database';
import { getFirebaseUserByUid } from '../config/firebase';
import { User } from '../models/User';
import { ROLES } from '../constants/roles';
import { logger } from '../utils/logger';

async function bootstrapSuperAdmin() {
  // Parse command line arguments: --uid=<FIREBASE_UID> or --uid <FIREBASE_UID>, --recovery / --force
  const args = process.argv.slice(2);
  let targetUid = '';
  let isRecovery = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--uid=')) {
      targetUid = arg.replace('--uid=', '').trim().replace(/^["']|["']$/g, '');
    } else if (arg === '--uid' && i + 1 < args.length) {
      targetUid = args[++i].trim().replace(/^["']|["']$/g, '');
    } else if (arg === '--recovery' || arg === '--force') {
      isRecovery = true;
    }
  }

  if (!targetUid) {
    console.error('\n❌ Usage: npm run admin:bootstrap -- --uid=YOUR_FIREBASE_UID [--recovery]\n');
    console.error('Please specify your Firebase UID obtained from the Firebase Console.');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('🛡️  TriPro ECM — Super-Admin Bootstrap CLI');
  console.log('======================================================');
  console.log('Connecting to MongoDB using MONGODB_URI from server environment...');

  try {
    await connectDatabase();

    // 1. Verify target UID with Firebase Authentication
    console.log(`Verifying target UID with Firebase Admin SDK: [${targetUid}]...`);
    const verifiedFirebaseUser = await getFirebaseUserByUid(targetUid);

    if (!verifiedFirebaseUser) {
      console.error(`\n❌ Firebase Verification Failed: No account found for UID: ${targetUid}.`);
      console.error('Please ensure you have created your account in Firebase Authentication first.');
      console.error('Also ensure your Firebase service account credentials in server/.env are valid.');
      await disconnectDatabase();
      process.exit(1);
    }

    console.log(`✓ Firebase UID successfully verified.`);
    console.log(`  UID:   ${verifiedFirebaseUser.uid}`);
    console.log(`  Email: ${verifiedFirebaseUser.email || '(no email assigned)'}`);

    // 2. Safeguard: Validate that no super-admin already exists unless explicit recovery is requested
    const existingSuperAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });

    if (existingSuperAdmin && !isRecovery) {
      if (existingSuperAdmin.firebaseUid === targetUid) {
        console.log(`\nℹ️  User [${targetUid}] is already configured as the Super-Admin.`);
        console.log('No modifications required.');
        await disconnectDatabase();
        process.exit(0);
      }

      console.error('\n⚠️  SECURITY SAFEGUARD:');
      console.error('A Super-Admin account already exists in this deployment.');
      console.error(`Existing Super-Admin: ${existingSuperAdmin.email}`);
      console.error('\nTo recover or promote this user, execute with the explicit recovery procedure:');
      console.error(`npm run admin:bootstrap -- --uid=${targetUid} --recovery\n`);
      await disconnectDatabase();
      process.exit(1);
    }

    // 3. Find or safely create User in MongoDB without duplicates
    // Check by firebaseUid first, then by normalized email if present
    let user = await User.findOne({ firebaseUid: targetUid });

    if (!user && verifiedFirebaseUser.email) {
      user = await User.findOne({ email: verifiedFirebaseUser.email.toLowerCase().trim() });
      if (user) {
        user.firebaseUid = targetUid;
      }
    }

    if (!user) {
      console.log('Creating new local User document with super-admin role...');
      user = await User.create({
        firebaseUid: verifiedFirebaseUser.uid,
        email: verifiedFirebaseUser.email || `${targetUid}@tripro.local`,
        displayName: verifiedFirebaseUser.displayName || 'Platform Super Admin',
        role: ROLES.SUPER_ADMIN,
        status: 'active',
      });
    } else {
      console.log(`Promoting existing user [${user.email}] to super-admin...`);
      user.role = ROLES.SUPER_ADMIN;
      user.status = 'active';
      if (verifiedFirebaseUser.displayName && !user.displayName) {
        user.displayName = verifiedFirebaseUser.displayName;
      }
      await user.save();
    }

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: Super-Admin Privileges Configured!');
    console.log('======================================================');
    console.log(`User ID:       ${user._id}`);
    console.log(`Firebase UID:  ${user.firebaseUid}`);
    console.log(`Email:         ${user.email}`);
    console.log(`Display Name:  ${user.displayName}`);
    console.log(`Role:          ${user.role}`);
    console.log(`Status:        ${user.status}`);
    console.log('======================================================\n');

    logger.info(
      { uid: user.firebaseUid, email: user.email, role: user.role },
      'Super-admin bootstrapped successfully via server CLI'
    );
  } catch (error) {
    console.error('\n❌ Bootstrap Execution Error:', (error as Error).message);
    process.exit(1);
  } finally {
    // 4. Always close database connection cleanly
    await disconnectDatabase();
    console.log('Database connection closed cleanly.');
  }
}

bootstrapSuperAdmin().catch((err) => {
  console.error('Fatal CLI bootstrap failure:', err);
  process.exit(1);
});
