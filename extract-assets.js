import sharp from 'sharp';
import fs from 'fs';

async function extract() {
  const mockup = sharp('./public/mockup.jpg');
  const metadata = await mockup.metadata();
  console.log('Mockup metadata:', metadata);

  // 1. Sidebar Top Logo (Ela fit + subtitle)
  await sharp('./public/mockup.jpg')
    .extract({ left: 18, top: 15, width: 145, height: 100 })
    .toFile('./public/sidebar-logo.png');

  // 2. Sidebar bottom athlete card
  await sharp('./public/mockup.jpg')
    .extract({ left: 11, top: 490, width: 160, height: 185 })
    .toFile('./public/sidebar-bottom-card.jpg');

  // 3. Just the athlete photo without card text if needed
  await sharp('./public/mockup.jpg')
    .extract({ left: 11, top: 490, width: 160, height: 185 })
    .toFile('./public/athlete-water.jpg');

  // 4. Hero banner photo (woman smiling in gym with necklace)
  // In 1024x682:
  // Hero section is approx left: 200 to 580, top: 208 to 395
  await sharp('./public/mockup.jpg')
    .extract({ left: 201, top: 208, width: 368, height: 187 })
    .toFile('./public/hero-banner.jpg');

  // 5. Header admin avatar (Evanilson)
  await sharp('./public/mockup.jpg')
    .extract({ left: 881, top: 12, width: 35, height: 35 })
    .toFile('./public/avatar-admin.jpg');

  // 6. Registered clients avatars
  // Mariana Tchissola
  await sharp('./public/mockup.jpg')
    .extract({ left: 793, top: 439, width: 26, height: 26 })
    .toFile('./public/avatar-client-1.jpg');

  // Cláudia Mateus
  await sharp('./public/mockup.jpg')
    .extract({ left: 793, top: 472, width: 26, height: 26 })
    .toFile('./public/avatar-client-2.jpg');

  // Sónia Kapinga
  await sharp('./public/mockup.jpg')
    .extract({ left: 793, top: 504, width: 26, height: 26 })
    .toFile('./public/avatar-client-3.jpg');

  // Vanessa Pedro
  await sharp('./public/mockup.jpg')
    .extract({ left: 793, top: 536, width: 26, height: 26 })
    .toFile('./public/avatar-client-4.jpg');

  // Helena Ndala
  await sharp('./public/mockup.jpg')
    .extract({ left: 793, top: 568, width: 26, height: 26 })
    .toFile('./public/avatar-client-5.jpg');

  // 7. Extract the circular logo center from logo.png as well
  // logo.png is 1021 x 1024
  // Center Ela fit is approx at center
  await sharp('./public/logo.png')
    .extract({ left: 160, top: 280, width: 700, height: 460 })
    .toFile('./public/logo-center.png');

  console.log('All exact assets extracted successfully!');
}

extract().catch(console.error);
