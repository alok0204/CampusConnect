import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import LostFound from '../models/LostFound.js';
import Claim from '../models/Claim.js';
import Announcement from '../models/Announcement.js';
import Club from '../models/Club.js';
import Notification from '../models/Notification.js';
import { connectDB } from '../config/db.js';

dotenv.config();

export const getDefaultUsers = async () => {
  const passwordHash = await User.hashPassword('Student@123');
  const adminHash = await User.hashPassword('Admin@123');
  const facultyHash = await User.hashPassword('Faculty@123');

  return [
    {
      name: 'Campus Administrator',
      email: 'admin@campus.edu',
      passwordHash: adminHash,
      collegeId: 'ADMIN001',
      role: 'ADMIN',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Anshul Sharma',
      email: 'anshul.cse@campus.edu',
      passwordHash: passwordHash,
      collegeId: '22CSE042',
      rollNumber: '22CSE042',
      branch: 'CSE',
      year: '2nd Year',
      section: 'A',
      role: 'STUDENT',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rohit Verma',
      email: 'rohit.ece@campus.edu',
      passwordHash: passwordHash,
      collegeId: '22ECE018',
      rollNumber: '22ECE018',
      branch: 'ECE',
      year: '2nd Year',
      section: 'B',
      role: 'STUDENT',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sneha Patel',
      email: 'sneha.cse@campus.edu',
      passwordHash: passwordHash,
      collegeId: '21CSE089',
      rollNumber: '21CSE089',
      branch: 'CSE',
      year: '3rd Year',
      section: 'A',
      role: 'STUDENT',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@campus.edu',
      passwordHash: facultyHash,
      collegeId: 'FAC_CSE_101',
      department: 'Computer Science & Engineering',
      role: 'FACULTY',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];
};

export const getDefaultClubs = (usersMap) => {
  const admin = usersMap['admin@campus.edu'] || usersMap['ADMIN001'];
  const anshul = usersMap['anshul.cse@campus.edu'] || usersMap['22CSE042'];
  const rohit = usersMap['rohit.ece@campus.edu'] || usersMap['22ECE018'];
  const sneha = usersMap['sneha.cse@campus.edu'] || usersMap['21CSE089'];
  const faculty = usersMap['dr.sharma@campus.edu'] || usersMap['FAC_CSE_101'];

  return [
    {
      name: 'Google Developer Student Club (GDSC)',
      shortDescription:
        'A community for student developers interested in web, cloud, machine learning, and mobile application architectures.',
      description:
        'Google Developer Student Club is a university-based community group for students interested in Google developer technologies. By joining GDSC, students grow their knowledge in a peer-to-peer learning environment and build solutions for local businesses and their community.',
      category: 'Technical',
      department: 'Computer Science & Engineering',
      branch: 'CSE',
      facultyCoordinator: faculty._id,
      studentPresident: anshul._id,
      studentSecretary: sneha._id,
      contactEmail: 'gdsc@campus.edu',
      contactPhone: '+91 98765 43210',
      socialLinks: {
        website: 'https://gdsc.community.dev',
        github: 'https://github.com/campus-gdsc',
        linkedin: 'https://linkedin.com/company/campus-gdsc',
        instagram: 'https://instagram.com/campus_gdsc',
      },
      logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      members: [
        { user: faculty._id, role: 'Faculty Coordinator', joinedAt: new Date() },
        { user: anshul._id, role: 'President', joinedAt: new Date() },
        { user: sneha._id, role: 'Secretary', joinedAt: new Date() },
      ],
      pendingMembers: [],
      status: 'active',
      createdBy: faculty._id,
    },
    {
      name: 'ROBOTRON — Robotics & Automation Club',
      shortDescription:
        'Hands-on embedded systems, autonomous drones, ROS architecture, and combat robotics prototyping hub.',
      description:
        'Robotron is the official hardware innovation and robotics club. We design, solder, fabricate, and program microcontrollers, robotic arms, and autonomous systems to represent our college in national and international competitions.',
      category: 'Technical',
      department: 'Electronics & Communication',
      branch: 'ECE',
      facultyCoordinator: admin._id,
      studentPresident: rohit._id,
      studentSecretary: null,
      contactEmail: 'robotron@campus.edu',
      contactPhone: '+91 98765 43211',
      socialLinks: {
        website: 'https://robotron.campus.edu',
        github: 'https://github.com/robotron-campus',
        linkedin: 'https://linkedin.com/company/robotron-campus',
        instagram: '',
      },
      logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      members: [
        { user: admin._id, role: 'Faculty Coordinator', joinedAt: new Date() },
        { user: rohit._id, role: 'President', joinedAt: new Date() },
      ],
      pendingMembers: [],
      status: 'active',
      createdBy: rohit._id,
    },
    {
      name: 'RHYTHM — Music & Performing Arts Society',
      shortDescription:
        'The collegiate music ensemble covering classical melodies, acoustic jamming, rock band performances, and sound engineering.',
      description:
        'Rhythm brings together vocalists, instrumentalists, and audio enthusiasts. We host weekly open mic jam sessions, produce original university soundtracks, and organize the annual cultural musical night.',
      category: 'Music',
      department: 'Student Affairs',
      branch: 'ALL',
      facultyCoordinator: admin._id,
      studentPresident: sneha._id,
      studentSecretary: null,
      contactEmail: 'rhythm@campus.edu',
      contactPhone: '+91 98765 43212',
      socialLinks: {
        website: '',
        github: '',
        linkedin: '',
        instagram: 'https://instagram.com/rhythm_campus',
      },
      logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
      members: [
        { user: admin._id, role: 'Faculty Coordinator', joinedAt: new Date() },
        { user: sneha._id, role: 'President', joinedAt: new Date() },
      ],
      pendingMembers: [],
      status: 'active',
      createdBy: admin._id,
    },
    {
      name: 'Campus Chronicle — Literary & Debating Society',
      shortDescription:
        'The official college publication, parliamentary debating, journalism, and creative writing guild.',
      description:
        'Campus Chronicle publishes the monthly college magazine, hosts Model United Nations (MUN), organizes parliamentary debates, and provides a platform for passionate student journalists and writers.',
      category: 'Literary',
      department: 'Humanities & Social Sciences',
      branch: 'ALL',
      facultyCoordinator: admin._id,
      studentPresident: null,
      studentSecretary: null,
      contactEmail: 'chronicle@campus.edu',
      contactPhone: '',
      socialLinks: {
        website: 'https://chronicle.campus.edu',
        github: '',
        linkedin: '',
        instagram: '',
      },
      logo: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&auto=format&fit=crop&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
      members: [{ user: admin._id, role: 'Faculty Coordinator', joinedAt: new Date() }],
      pendingMembers: [],
      status: 'active',
      createdBy: admin._id,
    },
  ];
};

export const getDefaultEvents = (usersMap, clubsMap = {}) => {
  const admin = usersMap['admin@campus.edu'] || usersMap['ADMIN001'];
  const anshul = usersMap['anshul.cse@campus.edu'] || usersMap['22CSE042'];
  const rohit = usersMap['rohit.ece@campus.edu'] || usersMap['22ECE018'];

  const gdscClub = clubsMap['Google Developer Student Club (GDSC)'];
  const robotronClub = clubsMap['ROBOTRON — Robotics & Automation Club'];

  const today = new Date();
  const futureDate = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  return [
    {
      title: 'Annual Campus Tech Fest: INNOVEX 2026',
      description:
        'The flagship annual technical fest of our college featuring 48-hour hackathons, robotics challenges, coding relays, and project exhibitions with prizes worth 1 Lakh.',
      category: 'Hackathon',
      date: futureDate(5),
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      venue: 'Main College Auditorium & Tech Hub',
      organizer: 'Central Student Activity Council',
      club: gdscClub ? gdscClub._id : null,
      creator: admin._id,
      targetAudience: 'ALL',
      branch: 'ALL',
      image:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      rejectionReason: '',
    },
    {
      title: 'CSE Code Clash: Algorithmic Duel',
      description:
        'An intensive algorithmic competitive coding contest for Computer Science & Engineering students to test problem-solving, data structures, and speed.',
      category: 'Technical',
      date: futureDate(8),
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      venue: 'CS Lab 3 & 4 (Block A)',
      organizer: 'Google Developer Student Club (GDSC)',
      club: gdscClub ? gdscClub._id : null,
      creator: anshul._id,
      targetAudience: 'BRANCH_ONLY',
      branch: 'CSE',
      image:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      rejectionReason: '',
    },
    {
      title: 'ECE Robotics & IoT Hands-on Workshop',
      description:
        'Hands-on workshop on microcontroller programming, PCB layout basics, and IoT sensor telemetry tailored specifically for ECE students.',
      category: 'Workshop',
      date: futureDate(12),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      venue: 'Electronics Circuits Lab (Block B)',
      organizer: 'ROBOTRON — Robotics & Automation Club',
      club: robotronClub ? robotronClub._id : null,
      creator: rohit._id,
      targetAudience: 'BRANCH_ONLY',
      branch: 'ECE',
      image:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      rejectionReason: '',
    },
  ];
};

export const getDefaultLostFound = (usersMap) => {
  const anshul = usersMap['anshul.cse@campus.edu'] || usersMap['22CSE042'];
  const rohit = usersMap['rohit.ece@campus.edu'] || usersMap['22ECE018'];

  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  return [
    {
      title: 'Blue HP Pavilion Laptop Charger 65W',
      description:
        'Misplaced my original HP laptop pin charger with blue connector pin in CS Lab 2 during the afternoon lab session.',
      type: 'lost',
      category: 'Electronics',
      location: 'Computer Science Lab 2 (Row 4)',
      date: pastDate(1),
      time: '03:30 PM',
      image:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
      color: 'Black with blue tip',
      brand: 'HP',
      uniqueDetails: 'Has a small white tape marked "AS-CSE" near the adapter block.',
      contactPreference: 'portal',
      creator: anshul._id,
      status: 'active',
    },
    {
      title: 'boAt Airdopes 141 Wireless Earbuds (Black Case)',
      description:
        'Found a matte black wireless earbuds charging case on the study desk in the Library reading area.',
      type: 'found',
      category: 'Electronics',
      location: 'Central Library 2nd Floor (Quiet Zone)',
      date: pastDate(1),
      time: '11:00 AM',
      image:
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      color: 'Black',
      brand: 'boAt',
      uniqueDetails: 'Has a miniature Batman vinyl sticker on the top lid.',
      contactPreference: 'portal',
      creator: rohit._id,
      status: 'active',
      claimStatus: 'none',
    },
  ];
};

export const getDefaultAnnouncements = (usersMap, clubsMap = {}) => {
  const admin = usersMap['admin@campus.edu'] || usersMap['ADMIN001'];
  const faculty = usersMap['dr.sharma@campus.edu'] || usersMap['FAC_CSE_101'];
  const gdscClub = clubsMap['Google Developer Student Club (GDSC)'];

  const now = new Date();
  const pastDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const futureDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  return [
    {
      title: 'Official Notification: Mid-Semester Examination Schedule Spring 2026',
      summary:
        'The Controller of Examinations has published the final timetable and seating layout for the upcoming Mid-Semester theory and practical examinations.',
      content:
        'All undergraduate and postgraduate students are hereby notified that the Mid-Semester Examinations for Spring 2026 will commence from March 10, 2026.\n\nKey Guidelines:\n1. Students must carry their physical Student Smart ID cards to the examination hall.\n2. Digital devices, smartwatches, and programmable calculators are strictly prohibited.\n3. Seating arrangements will be displayed on department notice boards 30 minutes prior to exam commencement.\n\nFor any clashes or timetable queries, contact the Exam Cell (Block A, Room 102).',
      category: 'exam',
      priority: 'urgent',
      audience: 'all',
      branch: 'ALL',
      department: 'ALL',
      year: 'ALL',
      section: 'ALL',
      attachment: {
        name: 'Mid_Sem_Exam_Schedule_2026.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        fileSize: '1.2 MB',
      },
      image:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      createdBy: admin._id,
      status: 'published',
      publishAt: pastDays(1),
      expiresAt: futureDays(30),
      isPinned: true,
      readBy: [],
    },
    {
      title: 'CSE Department: Capstone Major Project Synopsis & Review 1 Deadlines',
      summary:
        'Detailed evaluation rubric, supervisor allotment, and submission deadline for Computer Science 3rd and 4th Year major capstone projects.',
      content:
        'Attention Computer Science & Engineering students:\n\nThe Department Academic Committee has finalized the schedule for Capstone Major Project Review 1.\n\nSubmission Requirements:\n- Abstract and System Architecture Diagram (IEEE format)\n- Git repository link with initial module commits\n- Supervisor approval signature slip\n\nDeadline for soft-copy submission via portal: Friday, 5:00 PM.',
      category: 'academic',
      priority: 'important',
      audience: 'branch',
      branch: 'CSE',
      department: 'Computer Science & Engineering',
      year: 'ALL',
      section: 'ALL',
      attachment: {
        name: 'CSE_Project_Review1_Rubric.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        fileSize: '850 KB',
      },
      image:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      createdBy: faculty._id,
      status: 'published',
      publishAt: pastDays(2),
      expiresAt: futureDays(20),
      isPinned: false,
      readBy: [],
    },
    {
      title: 'CSE 2nd Year Section A: Data Structures & Algorithms Lab Viva Schedule',
      summary:
        'Internal assessment and lab practical viva evaluation dates for CSE 2nd Year Section A students in CS Lab 3.',
      content:
        'This notice applies exclusively to CSE 2nd Year Section A students.\n\nThe end-term practical lab viva for CS-204 (Data Structures) will be conducted as per the roll number sequence:\n- Roll 22CSE001 to 22CSE035: 09:30 AM - 12:30 PM\n- Roll 22CSE036 to 22CSE070: 01:30 PM - 04:30 PM\n\nEnsure your lab records are signed and indexed before entering the lab.',
      category: 'academic',
      priority: 'important',
      audience: 'section',
      branch: 'CSE',
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      section: 'A',
      createdBy: faculty._id,
      status: 'published',
      publishAt: pastDays(1),
      expiresAt: futureDays(15),
      isPinned: false,
      readBy: [],
    },
    {
      title: 'ECE Department: VLSI Design Workshop & Semiconductor Kits Distribution',
      summary:
        'Special hands-on technical session on FPGA programming and Cadence EDA tools for Electronics & Communication students.',
      content:
        'The Department of Electronics and Communication Engineering is organizing a 2-day hands-on workshop on High-Speed VLSI Architecture.\n\nAll registered ECE students can collect their hardware prototyping kits from Block B, Room 204 from 10:00 AM onwards.',
      category: 'academic',
      priority: 'normal',
      audience: 'branch',
      branch: 'ECE',
      department: 'Electronics & Communication',
      year: 'ALL',
      section: 'ALL',
      image:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      createdBy: admin._id,
      status: 'published',
      publishAt: pastDays(3),
      expiresAt: futureDays(10),
      isPinned: false,
      readBy: [],
    },
    {
      title: 'Campus Placement Drive 2026: Tier-1 Technology Companies Registration',
      summary:
        'Training & Placement Cell circular regarding eligibility criteria, resume vetting, and online registration portal for upcoming campus placements.',
      content:
        'The Training and Placement Cell (T&P) is pleased to announce the upcoming campus recruitment schedule for the 2026 batch.\n\nParticipating Companies:\n- Tier-1 Software Engineering & Product Firms\n- Cloud Architecture & Consulting Conglomerates\n\nEligible students must verify their 10th, 12th, and CGPA records on the T&P portal by midnight.',
      category: 'placement',
      priority: 'urgent',
      audience: 'students',
      branch: 'ALL',
      department: 'ALL',
      year: 'ALL',
      section: 'ALL',
      attachment: {
        name: 'Placement_Eligibility_Matrix.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        fileSize: '540 KB',
      },
      image:
        'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=80',
      createdBy: admin._id,
      status: 'published',
      publishAt: pastDays(1),
      expiresAt: futureDays(45),
      isPinned: true,
      readBy: [],
    },
    {
      title: 'GDSC Web Development Bootcamp & Git/GitHub Starter Sessions',
      summary:
        'Join the Google Developer Student Club for weekly interactive workshops covering full-stack React, Node.js, and open-source contribution.',
      content:
        'The Google Developer Student Club is kicking off its Spring 2026 Web Development & Open Source series.\n\nPrerequisites: None! Bring your laptop with VS Code and Git installed.\nVenue: Block A, Lab 4, Every Wednesday 4:30 PM.',
      category: 'event',
      priority: 'normal',
      audience: 'all',
      branch: 'ALL',
      department: 'Computer Science & Engineering',
      year: 'ALL',
      section: 'ALL',
      club: gdscClub ? gdscClub._id : null,
      createdBy: faculty._id,
      status: 'published',
      publishAt: pastDays(1),
      expiresAt: futureDays(60),
      isPinned: false,
      readBy: [],
    },
  ];
};

export const getDefaultNotifications = (usersMap) => {
  const anshul = usersMap['anshul.cse@campus.edu'] || usersMap['22CSE042'];
  const rohit = usersMap['rohit.ece@campus.edu'] || usersMap['22ECE018'];

  return [
    {
      recipient: anshul._id,
      type: 'event',
      title: 'Event Approved: CSE Code Clash',
      message: 'Your event proposal "CSE Code Clash: Algorithmic Duel" was approved by the campus administration.',
      entityType: 'Event',
      priority: 'important',
      isRead: false,
      metadata: { actionUrl: '/events', status: 'approved' },
    },
    {
      recipient: anshul._id,
      type: 'announcement',
      title: '🚨 URGENT: Mid-Semester Exam Schedule',
      message: 'The Mid-Semester exam timetable Spring 2026 has been published by the examination authority.',
      entityType: 'Announcement',
      priority: 'urgent',
      isRead: false,
      metadata: { actionUrl: '/announcements', status: 'published' },
    },
    {
      recipient: rohit._id,
      type: 'club',
      title: 'Welcome to ROBOTRON Club',
      message: 'Your leadership assignment as President for ROBOTRON has been activated.',
      entityType: 'Club',
      priority: 'important',
      isRead: false,
      metadata: { actionUrl: '/clubs', status: 'approved' },
    },
  ];
};

export const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial users, clubs, events, lost & found, announcements, and notifications...');
      const users = await getDefaultUsers();
      const createdUsers = await User.insertMany(users);

      const usersMap = {};
      createdUsers.forEach((u) => {
        usersMap[u.email] = u;
      });

      const clubs = getDefaultClubs(usersMap);
      const createdClubs = await Club.insertMany(clubs);

      const clubsMap = {};
      createdClubs.forEach((c) => {
        clubsMap[c.name] = c;
      });

      const events = getDefaultEvents(usersMap, clubsMap);
      await Event.insertMany(events);

      const lostFound = getDefaultLostFound(usersMap);
      await LostFound.insertMany(lostFound);

      const announcements = getDefaultAnnouncements(usersMap, clubsMap);
      await Announcement.insertMany(announcements);

      const notifications = getDefaultNotifications(usersMap);
      await Notification.insertMany(notifications);

      console.log(
        `✅ Auto-seeded ${createdUsers.length} users, ${createdClubs.length} clubs, ${events.length} events, ${lostFound.length} lost/found items, ${announcements.length} announcements, ${notifications.length} notifications.`
      );
    } else {
      // Ensure the 4 primary demo users exist
      const defaultUsers = await getDefaultUsers();
      for (const defUser of defaultUsers) {
        const existing = await User.findOne({
          $or: [{ email: defUser.email }, { collegeId: defUser.collegeId }],
        });
        if (!existing) {
          await User.create(defUser);
        }
      }

      // Check if Notifications are present
      const notifCount = await Notification.countDocuments();
      const existingUsers = await User.find();
      const usersMap = {};
      existingUsers.forEach((u) => {
        usersMap[u.email] = u;
      });

      if (notifCount === 0 && usersMap['anshul.cse@campus.edu']) {
        console.log('🌱 Auto-seeding initial sample notifications...');
        const notifications = getDefaultNotifications(usersMap);
        await Notification.insertMany(notifications);
        console.log(`✅ Auto-seeded ${notifications.length} notifications.`);
      }
    }
  } catch (error) {
    console.error('⚠️ Auto-seed error:', error.message);
  }
};

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Clearing existing collections and reseeding all phases...');
    await User.deleteMany({});
    await Club.deleteMany({});
    await Event.deleteMany({});
    await LostFound.deleteMany({});
    await Claim.deleteMany({});
    await Announcement.deleteMany({});
    await Notification.deleteMany({});

    const users = await getDefaultUsers();
    const createdUsers = await User.insertMany(users);

    const usersMap = {};
    createdUsers.forEach((u) => {
      usersMap[u.email] = u;
    });

    const clubs = getDefaultClubs(usersMap);
    const createdClubs = await Club.insertMany(clubs);

    const clubsMap = {};
    createdClubs.forEach((c) => {
      clubsMap[c.name] = c;
    });

    const events = getDefaultEvents(usersMap, clubsMap);
    const createdEvents = await Event.insertMany(events);

    const lostFound = getDefaultLostFound(usersMap);
    const createdLostFound = await LostFound.insertMany(lostFound);

    const announcements = getDefaultAnnouncements(usersMap, clubsMap);
    const createdAnnouncements = await Announcement.insertMany(announcements);

    const notifications = getDefaultNotifications(usersMap);
    const createdNotifications = await Notification.insertMany(notifications);

    console.log(`✅ Seeded ${createdUsers.length} initial test users.`);
    console.log(`✅ Seeded ${createdClubs.length} initial test clubs.`);
    console.log(`✅ Seeded ${createdEvents.length} initial test events.`);
    console.log(`✅ Seeded ${createdLostFound.length} initial test Lost & Found listings.`);
    console.log(`✅ Seeded ${createdAnnouncements.length} initial test announcements.`);
    console.log(`✅ Seeded ${createdNotifications.length} initial test notifications.`);

    console.log('\n🔑 Default Logins:');
    console.log('Admin:       admin@campus.edu / Admin@123');
    console.log('Student A:   anshul.cse@campus.edu / Student@123 (CSE - 2nd Year - Sec A)');
    console.log('Student B:   rohit.ece@campus.edu / Student@123 (ECE - 2nd Year - Sec B)');
    console.log('Faculty:     dr.sharma@campus.edu / Faculty@123 (CSE Dept)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
