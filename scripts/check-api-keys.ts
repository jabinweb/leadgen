import { PrismaClient } from '@prisma/client';
import { decrypt } from '../lib/encryption';

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    const profiles = await prisma.userProfile.findMany({
      select: {
        id: true,
        userId: true,
        geminiApiKey: true,
        googlePlacesApiKey: true,
        aiModel: true,
      },
    });

    console.log('\n=== User Profiles API Keys & Models ===\n');

    for (const profile of profiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Profile ID: ${profile.id}`);
      console.log(`User ID: ${profile.userId}`);
      console.log(`\n🤖 AI Model: ${profile.aiModel || '❌ not set'}`);
      console.log(`${'='.repeat(60)}\n`);
      
      if (profile.geminiApiKey) {
        console.log('\nGemini API Key:');
        console.log('  Encrypted:', profile.geminiApiKey.substring(0, 50) + '...');
        try {
          const decrypted = decrypt(profile.geminiApiKey);
          console.log('  Decrypted:', decrypted);
          console.log('  Length:', decrypted.length);
          console.log('  First 10 chars:', decrypted.substring(0, 10));
          console.log('  Is bullets?', decrypted === '••••••••');
          
          // Check for non-ASCII
          const hasNonAscii = !/^[\x00-\x7F]*$/.test(decrypted);
          console.log('  Has non-ASCII chars?', hasNonAscii);
          
          if (hasNonAscii) {
            console.log('  Non-ASCII character codes:');
            for (let i = 0; i < Math.min(decrypted.length, 20); i++) {
              const code = decrypted.charCodeAt(i);
              console.log(`    [${i}] '${decrypted[i]}' = ${code}`);
            }
          }
        } catch (error) {
          console.log('  Error decrypting:', error);
        }
      } else {
        console.log('Gemini API Key: not set');
      }

      if (profile.googlePlacesApiKey) {
        console.log('\nGoogle Places API Key:');
        console.log('  Encrypted:', profile.googlePlacesApiKey.substring(0, 50) + '...');
        try {
          const decrypted = decrypt(profile.googlePlacesApiKey);
          console.log('  Decrypted:', decrypted);
          console.log('  Length:', decrypted.length);
        } catch (error) {
          console.log('  Error decrypting:', error);
        }
      } else {
        console.log('Google Places API Key: not set');
      }

      console.log('\n---\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
