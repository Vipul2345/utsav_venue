const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing records to ensure clean idempotent seed
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingItem.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.availabilityBlock.deleteMany({});
  await prisma.hallAddon.deleteMany({});
  await prisma.pricingRule.deleteMany({});
  await prisma.hallMedia.deleteMany({});
  await prisma.hallAmenity.deleteMany({});
  await prisma.hallOccasion.deleteMany({});
  await prisma.hall.deleteMany({});
  await prisma.locality.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.occasion.deleteMany({});
  await prisma.amenity.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.adminProfile.deleteMany({});
  await prisma.managerProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin Users
  console.log('Seeding Admins...');
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@platform.com',
      fullName: 'Vikramaditya Rao (Super Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          adminRole: 'SUPER_ADMIN',
          permissions: JSON.stringify(['*']),
        },
      },
    },
  });

  const opsAdminUser = await prisma.user.create({
    data: {
      email: 'opsadmin@platform.com',
      fullName: 'Ayesha Khan (Ops Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          adminRole: 'OPERATIONS_ADMIN',
          permissions: JSON.stringify([
            'view_halls',
            'manage_halls',
            'view_bookings',
            'manage_bookings',
            'view_users',
            'manage_users',
            'view_audit_logs',
          ]),
        },
      },
    },
  });

  const verifyAdminUser = await prisma.user.create({
    data: {
      email: 'verifyadmin@platform.com',
      fullName: 'Ramesh Sundaram (Verification Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          adminRole: 'VERIFICATION_ADMIN',
          permissions: JSON.stringify([
            'view_managers',
            'verify_managers',
            'view_halls',
            'approve_halls',
            'reject_halls',
            'approve_occasions',
            'view_audit_logs',
          ]),
        },
      },
    },
  });

  const financeAdminUser = await prisma.user.create({
    data: {
      email: 'financeadmin@platform.com',
      fullName: 'Sunita Agarwal (Finance Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          adminRole: 'FINANCE_ADMIN',
          permissions: JSON.stringify([
            'view_payments',
            'manage_refunds',
            'view_reports',
            'view_commissions',
            'view_bookings',
          ]),
        },
      },
    },
  });

  const supportAdminUser = await prisma.user.create({
    data: {
      email: 'supportadmin@platform.com',
      fullName: 'Karan Mehta (Support Admin)',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          adminRole: 'SUPPORT_ADMIN',
          permissions: JSON.stringify([
            'view_bookings',
            'manage_bookings',
            'view_users',
            'view_reviews',
            'manage_reviews',
            'view_halls',
          ]),
        },
      },
    },
  });

  // 2. Create Cities and Localities
  console.log('Seeding Cities and Localities...');
  const bangalore = await prisma.city.create({
    data: {
      name: 'Bangalore',
      slug: 'bangalore',
      state: 'Karnataka',
      localities: {
        create: [
          { name: 'Palace Grounds', slug: 'palace-grounds' },
          { name: 'Indiranagar', slug: 'indiranagar' },
          { name: 'Koramangala', slug: 'koramangala' },
          { name: 'Whitefield', slug: 'whitefield' },
          { name: 'Jayanagar', slug: 'jayanagar' },
        ],
      },
    },
    include: { localities: true },
  });

  const mumbai = await prisma.city.create({
    data: {
      name: 'Mumbai',
      slug: 'mumbai',
      state: 'Maharashtra',
      localities: {
        create: [
          { name: 'Bandra West', slug: 'bandra-west' },
          { name: 'Juhu', slug: 'juhu' },
          { name: 'Andheri East', slug: 'andheri-east' },
          { name: 'Powai', slug: 'powai' },
        ],
      },
    },
    include: { localities: true },
  });

  const delhi = await prisma.city.create({
    data: {
      name: 'Delhi NCR',
      slug: 'delhi-ncr',
      state: 'Delhi',
      localities: {
        create: [
          { name: 'Chhatarpur', slug: 'chhatarpur' },
          { name: 'Aerocity', slug: 'aerocity' },
          { name: 'Gurgaon Golf Course', slug: 'gurgaon-golf-course' },
        ],
      },
    },
    include: { localities: true },
  });

  const hyderabad = await prisma.city.create({
    data: {
      name: 'Hyderabad',
      slug: 'hyderabad',
      state: 'Telangana',
      localities: {
        create: [
          { name: 'Banjara Hills', slug: 'banjara-hills' },
          { name: 'Jubilee Hills', slug: 'jubilee-hills' },
          { name: 'Gachibowli', slug: 'gachibowli' },
        ],
      },
    },
    include: { localities: true },
  });

  // 3. Create Occasions
  console.log('Seeding Occasions...');
  const occasionsData = [
    { name: 'Wedding', slug: 'wedding', icon: 'Heart', description: 'Grand marriage ceremonies and pheras' },
    { name: 'Reception', slug: 'reception', icon: 'Wine', description: 'Post-wedding celebrations and dining' },
    { name: 'Engagement', slug: 'engagement', icon: 'Sparkles', description: 'Ring ceremony and cocktail evenings' },
    { name: 'Birthday Party', slug: 'birthday-party', icon: 'Cake', description: 'Milestone birthday celebrations' },
    { name: 'Anniversary', slug: 'anniversary', icon: 'Gift', description: 'Silver, Golden, and annual milestones' },
    { name: 'Corporate Event', slug: 'corporate-event', icon: 'Briefcase', description: 'Annual general meetings, galas, award nights' },
    { name: 'Conference', slug: 'conference', icon: 'Presentation', description: 'Seminars, tech expos, summits' },
    { name: 'Cocktail Party', slug: 'cocktail-party', icon: 'GlassWater', description: 'Evening social gatherings and DJ nights' },
    { name: 'Baby Shower', slug: 'baby-shower', icon: 'Baby', description: 'Traditional godh bharai and baby welcomes' },
  ];

  const occasions = [];
  for (const occ of occasionsData) {
    const o = await prisma.occasion.create({ data: occ });
    occasions.push(o);
  }

  // 4. Create Amenities
  console.log('Seeding Amenities...');
  const amenitiesData = [
    { name: 'Central Air Conditioning', category: 'Facilities', icon: 'Wind' },
    { name: 'Valet Parking (100+ Cars)', category: 'Facilities', icon: 'Car' },
    { name: 'Dedicated Dining Hall', category: 'Dining', icon: 'Utensils' },
    { name: 'In-House Gourmet Catering', category: 'Dining', icon: 'ChefHat' },
    { name: 'Concert Sound & DJ Console', category: 'Entertainment', icon: 'Music' },
    { name: 'Elevated Stage & Intelligent Lighting', category: 'Entertainment', icon: 'Sparkles' },
    { name: 'Bridal & Groom Dressing Suites', category: 'Services', icon: 'DoorClosed' },
    { name: 'Guest Accommodation Rooms', category: 'Services', icon: 'Bed' },
    { name: '100% Full Power Backup (DG Set)', category: 'Facilities', icon: 'Zap' },
    { name: 'High-Speed Wi-Fi', category: 'Facilities', icon: 'Wifi' },
  ];

  const amenities = [];
  for (const amen of amenitiesData) {
    const a = await prisma.amenity.create({ data: amen });
    amenities.push(a);
  }

  // 5. Create Managers
  console.log('Seeding Hall Managers...');
  const manager1User = await prisma.user.create({
    data: {
      email: 'manager.sharma@royalvenues.com',
      fullName: 'Rajesh Sharma',
      phone: '+91 98450 11223',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      managerProfile: {
        create: {
          businessName: 'Royal Venues & Hospitality Pvt Ltd',
          businessRegistrationNumber: 'U55101KA2018PTC112345',
          taxId: '29AABCR1234F1Z5',
          phone: '+91 98450 11223',
          address: '42 MG Road, Bangalore',
          city: 'Bangalore',
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedById: superAdminUser.id,
        },
      },
    },
    include: { managerProfile: true },
  });

  const manager2User = await prisma.user.create({
    data: {
      email: 'manager.patel@grandpalaces.com',
      fullName: 'Kishore Patel',
      phone: '+91 98200 44556',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      managerProfile: {
        create: {
          businessName: 'Grand Palace Venues Mumbai LLP',
          businessRegistrationNumber: 'AAA-9988-MH',
          taxId: '27AABCG5544K1ZX',
          phone: '+91 98200 44556',
          address: 'Sea View Promenade, Bandra, Mumbai',
          city: 'Mumbai',
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedById: superAdminUser.id,
        },
      },
    },
    include: { managerProfile: true },
  });

  const managerNewUser = await prisma.user.create({
    data: {
      email: 'manager.new@emergingvenues.com',
      fullName: 'Deepak Chawla',
      phone: '+91 97110 77889',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      managerProfile: {
        create: {
          businessName: 'Emerging Banquets & Resorts',
          businessRegistrationNumber: 'U74999DL2024PTC987654',
          taxId: '07AABCE9876Q1Z2',
          phone: '+91 97110 77889',
          address: 'Sector 29, Gurgaon',
          city: 'Delhi NCR',
          verificationStatus: 'PENDING', // For testing verification flow!
        },
      },
    },
    include: { managerProfile: true },
  });

  // 6. Create Customer Users
  console.log('Seeding Customers...');
  const customer1 = await prisma.user.create({
    data: {
      email: 'rahul.verma@example.com',
      fullName: 'Rahul Verma',
      phone: '+91 99887 66554',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'priya.nair@example.com',
      fullName: 'Priya Nair',
      phone: '+91 98765 43210',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
    },
  });

  // 7. Seed Banquet Halls
  console.log('Seeding Halls...');
  
  // Hall 1: The Grand Kohinoor Palace (Bangalore)
  const hall1 = await prisma.hall.create({
    data: {
      managerId: manager1User.managerProfile.id,
      name: 'The Grand Kohinoor Palace',
      slug: 'the-grand-kohinoor-palace-bangalore',
      description: 'A palatial heritage-inspired banquet destination situated inside lush landscaped grounds. Boasts a 30-foot crystal chandelier ceiling, royal entrance foyer, and manicured banquet lawn capable of hosting regal weddings, receptions, and mega corporate summits.',
      cityId: bangalore.id,
      localityId: bangalore.localities.find((l) => l.slug === 'palace-grounds')?.id,
      address: 'Gate 4, Jayamahal Road, Palace Grounds, Bangalore 560006',
      contactPhone: '+91 98450 11223',
      contactEmail: 'events@grandkohinoor.com',
      minCapacity: 200,
      maxCapacity: 1500,
      indoorAreaSqFt: 18000,
      outdoorAreaSqFt: 25000,
      hasParking: true,
      parkingCapacity: 300,
      roomsCount: 6,
      status: 'APPROVED',
      isFeatured: true,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: true,
      outsideCateringAllowed: false,
      outsideDecorAllowed: true,
      cancellationDeadlineHours: 72,
      refundPercentage: 80.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
            caption: 'Grand Ballroom with crystal chandeliers',
            isCover: true,
            displayOrder: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
            caption: 'Royal Dining setup and table decor',
            isCover: false,
            displayOrder: 2,
          },
          {
            url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
            caption: 'Illuminated evening banquet lawns',
            isCover: false,
            displayOrder: 3,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 125000,
          weekendMultiplier: 1.2,
          cleaningFee: 5000,
          securityDeposit: 25000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 850,
          perPlateNonVegPrice: 1100,
        },
      },
      addons: {
        create: [
          { name: 'Royal Floral Stage & Entrance Mandap', price: 45000, pricingType: 'FIXED', description: 'Fresh exotic orchid & rose floral decor' },
          { name: 'Concert Grade JBL Sound & Intelligent Moving Heads', price: 25000, pricingType: 'FIXED', description: 'Full DJ setup with audio engineer' },
          { name: '4K Drone & Cinematography Suite', price: 35000, pricingType: 'FIXED', description: '2 operators with edited highlight reels' },
          { name: 'Live Chaat & Mocktail Welcome Counters', price: 150, pricingType: 'PER_GUEST', description: 'Unlimited live appetizers for 3 hours' },
        ],
      },
    },
  });

  // Approved occasions for Hall 1
  const weddingOcc = occasions.find((o) => o.slug === 'wedding');
  const receptionOcc = occasions.find((o) => o.slug === 'reception');
  const engagementOcc = occasions.find((o) => o.slug === 'engagement');
  const corporateOcc = occasions.find((o) => o.slug === 'corporate-event');
  const birthdayOcc = occasions.find((o) => o.slug === 'birthday-party');

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall1.id, occasionId: weddingOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall1.id, occasionId: receptionOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall1.id, occasionId: engagementOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall1.id, occasionId: corporateOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      // Birthday requested by manager but rejected by admin to test independent rejection rule!
      { hallId: hall1.id, occasionId: birthdayOcc.id, status: 'REJECTED', rejectionReason: 'Venue min capacity (200) not suited for private birthday parties' },
    ],
  });

  // Connect Amenities for Hall 1
  for (const amen of amenities) {
    await prisma.hallAmenity.create({
      data: {
        hallId: hall1.id,
        amenityId: amen.id,
        isComplimentary: true,
      },
    });
  }

  // Hall 2: Emerald Lawns & Convention Center (Bangalore, Whitefield)
  const hall2 = await prisma.hall.create({
    data: {
      managerId: manager1User.managerProfile.id,
      name: 'Emerald Lawns & Convention Center',
      slug: 'emerald-lawns-convention-center-whitefield',
      description: 'Modern glass-facade convention hall featuring contemporary architectural lines, pillarless hall design, and sprawling open lawns ideal for weddings and tech conclaves.',
      cityId: bangalore.id,
      localityId: bangalore.localities.find((l) => l.slug === 'whitefield')?.id,
      address: 'ITPL Main Road, Whitefield, Bangalore 560066',
      contactPhone: '+91 98450 11224',
      contactEmail: 'booking@emeraldconvention.in',
      minCapacity: 100,
      maxCapacity: 800,
      indoorAreaSqFt: 12000,
      outdoorAreaSqFt: 15000,
      hasParking: true,
      parkingCapacity: 180,
      roomsCount: 4,
      status: 'APPROVED',
      isFeatured: false,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: true,
      outsideCateringAllowed: true,
      outsideDecorAllowed: true,
      cancellationDeadlineHours: 48,
      refundPercentage: 85.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
            caption: 'Spacious banquet hall with elegant drape work',
            isCover: true,
            displayOrder: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
            caption: 'Party buffet counter setting',
            isCover: false,
            displayOrder: 2,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 75000,
          weekendMultiplier: 1.15,
          cleaningFee: 3000,
          securityDeposit: 15000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 700,
          perPlateNonVegPrice: 950,
        },
      },
    },
  });

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall2.id, occasionId: weddingOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall2.id, occasionId: receptionOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall2.id, occasionId: corporateOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall2.id, occasionId: occasions.find((o) => o.slug === 'conference')?.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
    ],
  });

  for (const amen of amenities.slice(0, 7)) {
    await prisma.hallAmenity.create({
      data: { hallId: hall2.id, amenityId: amen.id, isComplimentary: true },
    });
  }

  // Hall 3: The Royal Pavilion at Sea Face (Mumbai, Bandra West)
  const hall3 = await prisma.hall.create({
    data: {
      managerId: manager2User.managerProfile.id,
      name: 'The Royal Pavilion at Sea Face',
      slug: 'the-royal-pavilion-sea-face-mumbai',
      description: 'Iconic Arabian Sea facing luxury banquet in Bandra. Features an open deck overlooking the waters, an opulent air-conditioned ballroom with imported Italian marble floors, and signature five-star catering.',
      cityId: mumbai.id,
      localityId: mumbai.localities.find((l) => l.slug === 'bandra-west')?.id,
      address: 'Carter Road Promenade, Bandra West, Mumbai 400050',
      contactPhone: '+91 98200 44556',
      contactEmail: 'pavilion@royalvenuesmumbai.com',
      minCapacity: 150,
      maxCapacity: 700,
      indoorAreaSqFt: 10000,
      outdoorAreaSqFt: 8000,
      hasParking: true,
      parkingCapacity: 120,
      roomsCount: 4,
      status: 'APPROVED',
      isFeatured: true,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: true,
      outsideCateringAllowed: false,
      outsideDecorAllowed: false,
      cancellationDeadlineHours: 96,
      refundPercentage: 75.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
            caption: 'Luxury oceanfront banquet setup',
            isCover: true,
            displayOrder: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
            caption: 'Intimate candle-lit evening tables',
            isCover: false,
            displayOrder: 2,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 150000,
          weekendMultiplier: 1.25,
          cleaningFee: 6000,
          securityDeposit: 30000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 1100,
          perPlateNonVegPrice: 1450,
        },
      },
    },
  });

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall3.id, occasionId: weddingOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall3.id, occasionId: receptionOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall3.id, occasionId: engagementOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall3.id, occasionId: occasions.find((o) => o.slug === 'cocktail-party')?.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
    ],
  });

  for (const amen of amenities) {
    await prisma.hallAmenity.create({
      data: { hallId: hall3.id, amenityId: amen.id, isComplimentary: true },
    });
  }

  // Hall 4: Mayur Imperial Banquet (Bangalore, Jayanagar)
  const hall4 = await prisma.hall.create({
    data: {
      managerId: manager1User.managerProfile.id,
      name: 'Mayur Imperial Banquet',
      slug: 'mayur-imperial-banquet-jayanagar',
      description: 'Cozy and premium air-conditioned banquet hall designed for intimate celebrations, birthdays, traditional engagements, and family gatherings in South Bangalore.',
      cityId: bangalore.id,
      localityId: bangalore.localities.find((l) => l.slug === 'jayanagar')?.id,
      address: '9th Main, 4th Block, Jayanagar, Bangalore 560011',
      contactPhone: '+91 98450 11225',
      contactEmail: 'contact@mayurimperial.in',
      minCapacity: 50,
      maxCapacity: 350,
      indoorAreaSqFt: 6000,
      outdoorAreaSqFt: 0,
      hasParking: true,
      parkingCapacity: 50,
      roomsCount: 2,
      status: 'APPROVED',
      isFeatured: false,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: false,
      outsideCateringAllowed: true,
      outsideDecorAllowed: true,
      cancellationDeadlineHours: 48,
      refundPercentage: 90.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
            caption: 'Warm gold and ivory themed banquet interior',
            isCover: true,
            displayOrder: 1,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 45000,
          weekendMultiplier: 1.1,
          cleaningFee: 2000,
          securityDeposit: 10000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 550,
          perPlateNonVegPrice: 750,
        },
      },
    },
  });

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall4.id, occasionId: birthdayOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall4.id, occasionId: engagementOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall4.id, occasionId: occasions.find((o) => o.slug === 'anniversary')?.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall4.id, occasionId: occasions.find((o) => o.slug === 'baby-shower')?.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
    ],
  });

  // Hall 5: The Manor Heritage Hall (Delhi NCR, Chhatarpur)
  const hall5 = await prisma.hall.create({
    data: {
      managerId: manager1User.managerProfile.id,
      name: 'The Manor Heritage Hall & Farm',
      slug: 'the-manor-heritage-chhatarpur-delhi',
      description: 'Luxury sprawling farmhouse venue in Chhatarpur with monumental Rajasthani archways, private gazebos, and grand banquet hall designed for majestic big-fat Indian weddings.',
      cityId: delhi.id,
      localityId: delhi.localities.find((l) => l.slug === 'chhatarpur')?.id,
      address: 'Main Chhatarpur Road, South Delhi, Delhi 110074',
      contactPhone: '+91 97110 55443',
      contactEmail: 'weddings@manorheritage.com',
      minCapacity: 250,
      maxCapacity: 1200,
      indoorAreaSqFt: 15000,
      outdoorAreaSqFt: 30000,
      hasParking: true,
      parkingCapacity: 250,
      roomsCount: 8,
      status: 'APPROVED',
      isFeatured: true,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: true,
      outsideCateringAllowed: false,
      outsideDecorAllowed: true,
      cancellationDeadlineHours: 120,
      refundPercentage: 70.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80',
            caption: 'Regal illuminated entrance and lawn',
            isCover: true,
            displayOrder: 1,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 180000,
          weekendMultiplier: 1.25,
          cleaningFee: 8000,
          securityDeposit: 40000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 1200,
          perPlateNonVegPrice: 1600,
        },
      },
    },
  });

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall5.id, occasionId: weddingOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall5.id, occasionId: receptionOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
    ],
  });

  // Hall 6: Aura Crystal Convention (Hyderabad, Banjara Hills)
  const hall6 = await prisma.hall.create({
    data: {
      managerId: manager2User.managerProfile.id,
      name: 'Aura Crystal Convention',
      slug: 'aura-crystal-convention-hyderabad',
      description: 'Modern luxury convention centre in prestigious Banjara Hills with double-height ceiling, acoustic walls, and grand dining section.',
      cityId: hyderabad.id,
      localityId: hyderabad.localities.find((l) => l.slug === 'banjara-hills')?.id,
      address: 'Road No. 12, Banjara Hills, Hyderabad 500034',
      contactPhone: '+91 98490 66778',
      contactEmail: 'info@auracrystal.com',
      minCapacity: 100,
      maxCapacity: 900,
      indoorAreaSqFt: 14000,
      outdoorAreaSqFt: 10000,
      hasParking: true,
      parkingCapacity: 150,
      roomsCount: 4,
      status: 'APPROVED',
      isFeatured: false,
      approvedAt: new Date(),
      approvedById: superAdminUser.id,
      alcoholAllowed: true,
      outsideCateringAllowed: false,
      outsideDecorAllowed: true,
      cancellationDeadlineHours: 72,
      refundPercentage: 80.0,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
            caption: 'Aura Ballroom stage setup',
            isCover: true,
            displayOrder: 1,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 85000,
          weekendMultiplier: 1.15,
          cleaningFee: 3500,
          securityDeposit: 15000,
          taxRatePercent: 18.0,
          perPlateVegPrice: 750,
          perPlateNonVegPrice: 1050,
        },
      },
    },
  });

  await prisma.hallOccasion.createMany({
    data: [
      { hallId: hall6.id, occasionId: weddingOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
      { hallId: hall6.id, occasionId: corporateOcc.id, status: 'APPROVED', approvedAt: new Date(), approvedById: superAdminUser.id },
    ],
  });

  // Hall 7: PENDING APPROVAL Hall (for testing admin approval workflow)
  const hallPending = await prisma.hall.create({
    data: {
      managerId: manager1User.managerProfile.id,
      name: 'Skyline Terrace & Banquet',
      slug: 'skyline-terrace-banquet-indiranagar',
      description: 'Rooftop glasshouse venue overlooking Indiranagar skyline, awaiting administrative verification.',
      cityId: bangalore.id,
      localityId: bangalore.localities.find((l) => l.slug === 'indiranagar')?.id,
      address: '100 Feet Road, Indiranagar, Bangalore 560038',
      contactPhone: '+91 98450 99000',
      contactEmail: 'skyline@venues.com',
      minCapacity: 40,
      maxCapacity: 200,
      status: 'PENDING_APPROVAL', // Unapproved, must NOT appear in customer searches!
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80',
            caption: 'Rooftop terrace preview',
            isCover: true,
            displayOrder: 1,
          },
        ],
      },
      pricingRule: {
        create: {
          baseRentalPrice: 40000,
          weekendMultiplier: 1.15,
          taxRatePercent: 18.0,
          perPlateVegPrice: 600,
          perPlateNonVegPrice: 800,
        },
      },
      occasions: {
        create: [
          { occasionId: birthdayOcc.id, status: 'PENDING' },
          { occasionId: engagementOcc.id, status: 'PENDING' },
        ],
      },
    },
  });

  // 8. Create Sample Bookings
  console.log('Seeding Bookings & Reviews...');
  
  // Past completed booking on Hall 1 by customer 1
  const pastBooking = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-00001',
      hallId: hall1.id,
      customerId: customer1.id,
      occasionId: weddingOcc.id,
      eventDate: '2026-02-15',
      startTime: '16:00',
      endTime: '23:00',
      guestCount: 400,
      cateringType: 'NON_VEG',
      status: 'COMPLETED',
      baseRentalAmount: 125000,
      cateringAmount: 440000,
      addonsAmount: 45000,
      taxesAmount: 110000,
      totalAmount: 720000,
      platformCommissionPercent: 10.0,
      platformCommissionAmount: 61000,
      managerPayoutAmount: 659000,
      payments: {
        create: {
          paymentNumber: 'PAY-2026-001',
          amount: 720000,
          status: 'SUCCESS',
          provider: 'MOCK_GATEWAY',
          providerTransactionId: 'txn_mock_past_001',
          paidAt: new Date('2026-01-20'),
        },
      },
    },
  });

  // Real review by Customer 1 on Hall 1 for completed booking
  await prisma.review.create({
    data: {
      hallId: hall1.id,
      customerId: customer1.id,
      bookingId: pastBooking.id,
      rating: 5,
      title: 'Spectacular wedding venue and impeccable service!',
      content: 'We hosted our daughter’s grand wedding reception here. The 30ft chandelier ballroom took everyone’s breath away, parking was super smooth for 300+ cars, and the gourmet catering was praised by all guests. Truly royal!',
      status: 'APPROVED',
      createdAt: new Date('2026-02-17'),
    },
  });

  // Upcoming confirmed booking on Hall 1
  await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2026-00002',
      hallId: hall1.id,
      customerId: customer2.id,
      occasionId: receptionOcc.id,
      eventDate: '2026-10-25',
      startTime: '18:00',
      endTime: '23:00',
      guestCount: 300,
      cateringType: 'VEG',
      status: 'CONFIRMED',
      baseRentalAmount: 150000,
      cateringAmount: 255000,
      addonsAmount: 25000,
      taxesAmount: 77400,
      totalAmount: 507400,
      platformCommissionPercent: 10.0,
      platformCommissionAmount: 43000,
      managerPayoutAmount: 464400,
      payments: {
        create: {
          paymentNumber: 'PAY-2026-002',
          amount: 507400,
          status: 'SUCCESS',
          provider: 'MOCK_GATEWAY',
          providerTransactionId: 'txn_mock_upc_002',
          paidAt: new Date(),
        },
      },
    },
  });

  // External Offline Booking on Hall 1 entered by manager
  await prisma.booking.create({
    data: {
      bookingNumber: 'EXT-2026-00001',
      hallId: hall1.id,
      isExternal: true,
      externalCustomerName: 'Col. K. S. Bakshi (Direct Booking)',
      externalCustomerPhone: '+91 98450 99887',
      occasionId: weddingOcc.id,
      eventDate: '2026-11-12',
      startTime: '10:00',
      endTime: '15:00',
      guestCount: 250,
      status: 'CONFIRMED',
      totalAmount: 110000,
      baseRentalAmount: 110000,
      platformCommissionPercent: 0,
      platformCommissionAmount: 0,
      managerPayoutAmount: 110000,
    },
  });

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: manager1User.id,
      title: 'Booking Confirmed (BK-2026-00002)',
      message: 'A new online booking has been confirmed for The Grand Kohinoor Palace on Oct 25, 2026.',
      type: 'BOOKING',
      link: '/manager/bookings',
    },
  });

  await prisma.notification.create({
    data: {
      userId: customer2.id,
      title: 'Payment Successful',
      message: 'Your booking for The Grand Kohinoor Palace has been confirmed! Reference: BK-2026-00002.',
      type: 'PAYMENT',
      link: '/bookings',
    },
  });

  // Seed Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: superAdminUser.id,
      actorRole: 'SUPER_ADMIN',
      actorEmail: superAdminUser.email,
      action: 'HALL_APPROVED',
      entityType: 'HALL',
      entityId: hall1.id,
      details: JSON.stringify({ hallName: hall1.name, note: 'Passed documentation & photo inspection' }),
    },
  });

  console.log('--- Seeding Completed Successfully! ---');
  console.log('\nDefault Test Accounts:');
  console.log('Super Admin:        superadmin@platform.com      | Password123!');
  console.log('Operations Admin:   opsadmin@platform.com        | Password123!');
  console.log('Verification Admin: verifyadmin@platform.com     | Password123!');
  console.log('Finance Admin:      financeadmin@platform.com    | Password123!');
  console.log('Support Admin:      supportadmin@platform.com    | Password123!');
  console.log('Hall Manager 1:     manager.sharma@royalvenues.com | Password123!');
  console.log('Hall Manager 2:     manager.patel@grandpalaces.com | Password123!');
  console.log('New Hall Manager:   manager.new@emergingvenues.com | Password123! (Pending verification)');
  console.log('Customer 1:         rahul.verma@example.com      | Password123!');
  console.log('Customer 2:         priya.nair@example.com       | Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
