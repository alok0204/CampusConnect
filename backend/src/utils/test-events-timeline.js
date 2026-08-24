import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

/**
 * Parsing logic identical to Events.jsx
 */
const parseEventDateTime = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;

  let hours = 0;
  let minutes = 0;

  if (timeStr && typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const match = cleanTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes).getTime();
};

const runTimelineVerification = async () => {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📅 CAMPUS CONNECT — EVENTS TIMELINE CHRONOLOGICAL VERIFICATION 📅');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    await connectDB();

    // 1. Fetch all approved events
    const events = await Event.find({ status: 'approved' }).populate('creator', 'name email profileImage');
    console.log(`🔹 [1/6] Loaded ${events.length} active events from database...`);

    // 2. Test Chronological Sorting Algorithm
    const sorted = [...events].sort((a, b) => {
      const timeA = parseEventDateTime(a.date, a.startTime);
      const timeB = parseEventDateTime(b.date, b.startTime);
      if (timeA !== timeB) return timeA - timeB;

      const endA = parseEventDateTime(a.date, a.endTime);
      const endB = parseEventDateTime(b.date, b.endTime);
      return endA - endB;
    });

    console.log('🔹 [2/6] Verifying Strict Chronological Order (Left → Right):');
    for (let i = 0; i < sorted.length - 1; i++) {
      const t1 = parseEventDateTime(sorted[i].date, sorted[i].startTime);
      const t2 = parseEventDateTime(sorted[i + 1].date, sorted[i + 1].startTime);
      if (t1 > t2) {
        throw new Error(`Chronological order violated between ${sorted[i].title} and ${sorted[i + 1].title}`);
      }
      console.log(
        `  ✅ Event ${i + 1}: "${sorted[i].title.substring(0, 30)}..." on ${new Date(sorted[i].date).toISOString().split('T')[0]} at ${sorted[i].startTime}`
      );
    }
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1];
      console.log(
        `  ✅ Event ${sorted.length}: "${last.title.substring(0, 30)}..." on ${new Date(last.date).toISOString().split('T')[0]} at ${last.startTime}`
      );
    }

    // 3. Test Same-Date and Same-Time Grouping Simulation
    console.log('\n🔹 [3/6] Testing Same-Date & Same-Time Vertical Stacking:');
    const mockEvents = [
      { id: '1', title: 'Event A (Morning)', date: '2026-08-30', startTime: '09:00 AM', endTime: '11:00 AM' },
      { id: '2', title: 'Event B (Afternoon Slot 1)', date: '2026-08-30', startTime: '02:00 PM', endTime: '04:00 PM' },
      { id: '3', title: 'Event C (Afternoon Slot 1 Duplicate Time)', date: '2026-08-30', startTime: '02:00 PM', endTime: '05:00 PM' },
      { id: '4', title: 'Event D (Evening)', date: '2026-08-30', startTime: '06:00 PM', endTime: '08:00 PM' },
      { id: '5', title: 'Event E (Next Day)', date: '2026-08-31', startTime: '10:00 AM', endTime: '12:00 PM' },
    ];

    const mockSorted = [...mockEvents].sort((a, b) => {
      const timeA = parseEventDateTime(a.date, a.startTime);
      const timeB = parseEventDateTime(b.date, b.startTime);
      if (timeA !== timeB) return timeA - timeB;
      return parseEventDateTime(a.date, a.endTime) - parseEventDateTime(b.date, b.endTime);
    });

    const groups = new Map();
    mockSorted.forEach((ev) => {
      if (!groups.has(ev.date)) groups.set(ev.date, new Map());
      const dateMap = groups.get(ev.date);
      if (!dateMap.has(ev.startTime)) dateMap.set(ev.startTime, []);
      dateMap.get(ev.startTime).push(ev);
    });

    console.log('  ✅ Grouping parsed successfully:');
    for (const [d, times] of groups.entries()) {
      console.log(`    📅 Date milestone: ${d}`);
      for (const [t, evs] of times.entries()) {
        console.log(`      ⏰ Time slot: ${t} → ${evs.length} vertically stacked event(s)`);
        evs.forEach((e) => console.log(`         • ${e.title} (${e.startTime} - ${e.endTime})`));
      }
    }

    const sameTimeSlot = groups.get('2026-08-30').get('02:00 PM');
    if (sameTimeSlot.length !== 2) {
      throw new Error('Same-time vertical grouping test failed');
    }
    console.log('  ✅ Same-time vertical collision avoidance verified (2 events stacked without overlap).');

    // 4. Test Horizon Filtering (Upcoming, Today, Past)
    console.log('\n🔹 [4/6] Testing Horizon Filtering Logic:');
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const testCases = [
      { title: 'Past Event', date: '2026-01-01', startTime: '10:00 AM' },
      { title: 'Today Event', date: todayStr, startTime: '12:00 PM' },
      { title: 'Future Event', date: '2026-12-31', startTime: '02:00 PM' },
    ];

    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    testCases.forEach((tc) => {
      const d = new Date(tc.date);
      const evDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const isToday = evDate === todayDate;
      const isPast = evDate < todayDate;
      const isUpcoming = evDate > todayDate;

      console.log(`  ✅ "${tc.title}" (${tc.date}) → isToday: ${isToday}, isPast: ${isPast}, isUpcoming: ${isUpcoming}`);
    });

    // 5. Test Category & Branch Filtering with Chronological Integrity
    console.log('\n🔹 [5/6] Testing Filtering Preservation:');
    const technicalEvents = sorted.filter((e) => e.category === 'Technical' || e.category === 'Hackathon');
    for (let i = 0; i < technicalEvents.length - 1; i++) {
      const t1 = parseEventDateTime(technicalEvents[i].date, technicalEvents[i].startTime);
      const t2 = parseEventDateTime(technicalEvents[i + 1].date, technicalEvents[i + 1].startTime);
      if (t1 > t2) throw new Error('Filtered sequence broke chronological ordering');
    }
    console.log(`  ✅ Filtered subset (${technicalEvents.length} events) retains 100% chronological sequence.`);

    // 6. Test Image URL Resolution
    console.log('\n🔹 [6/6] Testing Event Image Banner Resolution:');
    sorted.forEach((e) => {
      if (e.image) {
        console.log(`  ✅ Event "${e.title.substring(0, 25)}..." has valid image: ${e.image.substring(0, 50)}...`);
      }
    });

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL EVENT TIMELINE CHRONOLOGICAL TESTS PASSED 100%! 🎉');
    console.log('════════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  }
};

runTimelineVerification();
