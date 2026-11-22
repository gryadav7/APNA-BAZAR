import dotenv from "dotenv";
dotenv.config({ path: "APNA-BAZAR/backend/.env" });

import bcrypt from "bcryptjs";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";
import Business from "./src/models/Business.js";
import BusinessService from "./src/models/BusinessService.js";
import BusinessAvailability from "./src/models/BusinessAvailability.js";

const businessesData = [
  // 1. SALON & BEAUTY
  {
    owner: { name: "Aarav Sharma", email: "salon1@gmail.com" },
    business: {
      name: "Luxe Glow Salon & Spa",
      category: "Salon & Beauty",
      description: "Premium unisex salon offering luxury hair styling, facial care, bridal makeover, and relaxing spa therapies.",
      address: "Shop 14, Galleria Market, DLF Phase 4",
      city: "Gurugram",
      contactNumber: "9811223344",
      website: "https://luxeglow.com",
      openingHours: "09:00 AM - 09:00 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Executive Haircut & Beard Styling", description: "Precision haircut with wash, blow dry and beard sculpting.", price: 499, duration: 45 },
      { name: "Hydra Deep Cleansing Facial", description: "Multi-step hydrating facial treatment for radiant, glowing skin.", price: 1499, duration: 60 },
      { name: "Keratin Hair Smoothing Spa", description: "Deep conditioning keratin therapy for silky, frizz-free hair.", price: 2499, duration: 90 }
    ]
  },
  {
    owner: { name: "Pooja Verma", email: "salon2@gmail.com" },
    business: {
      name: "Style Crafters Beauty Lounge",
      category: "Salon & Beauty",
      description: "Modern beauty salon specialized in organic hair treatments, manicure, pedicure, and party makeup.",
      address: "B-22, Central Plaza, Sector 18",
      city: "Noida",
      contactNumber: "9871234567",
      website: "https://stylecrafters.in",
      openingHours: "10:00 AM - 08:30 PM",
      rating: 4.7,
      status: "ACTIVE"
    },
    services: [
      { name: "Advanced Hair Color & Highlights", description: "Ammonia-free global hair coloring with custom streaks.", price: 1999, duration: 90 },
      { name: "Deluxe Manicure & Pedicure", description: "Aroma bath soak, gentle scrub, cuticle care, and massage.", price: 799, duration: 50 },
      { name: "Bridal HD Party Makeup", description: "Flawless HD makeup including hair styling and draping.", price: 3499, duration: 75 }
    ]
  },

  // 2. HEALTHCARE
  {
    owner: { name: "Dr. Rajesh Gupta", email: "health1@gmail.com" },
    business: {
      name: "CarePlus Dental & Medical Clinic",
      category: "Healthcare",
      description: "Comprehensive multispecialty clinic offering advanced painless dental care, doctor consultations, and health checkups.",
      address: "Plot 45, Green Park Main",
      city: "Delhi",
      contactNumber: "9810998877",
      website: "https://careplusclinic.in",
      openingHours: "09:00 AM - 08:00 PM",
      rating: 4.9,
      status: "ACTIVE"
    },
    services: [
      { name: "Dental Checkup & Scaling (Cleaning)", description: "Complete oral examination and ultrasonic teeth cleaning.", price: 600, duration: 30 },
      { name: "Root Canal Therapy (Single Sitting)", description: "Painless computerized endodontic procedure.", price: 2500, duration: 60 },
      { name: "General Physician Health Consultation", description: "Routine health consultation, vitals monitoring, and prescription.", price: 500, duration: 20 }
    ]
  },
  {
    owner: { name: "Dr. Sneha Roy", email: "health2@gmail.com" },
    business: {
      name: "LifeLine Physiotherapy & Rehab",
      category: "Healthcare",
      description: "Expert physical rehabilitation, joint pain relief, spine care, and sports injury recovery.",
      address: "House 12, Indiranagar 100ft Road",
      city: "Bengaluru",
      contactNumber: "9822334455",
      website: "https://lifelinephysio.com",
      openingHours: "08:30 AM - 07:30 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Spine & Back Pain Therapy Session", description: "Manual manipulation, traction, and ultrasound pain relief therapy.", price: 800, duration: 45 },
      { name: "Post-Surgery Rehabilitation Consultation", description: "Tailored movement recovery plan and guided exercises.", price: 1000, duration: 60 },
      { name: "Sports Injury Assessment & Taping", description: "Biomechanical diagnosis, kinesiology taping, and mobility plan.", price: 750, duration: 40 }
    ]
  },

  // 3. FITNESS & GYM
  {
    owner: { name: "Vikram Singh", email: "gym1@gmail.com" },
    business: {
      name: "IronPulse Crossfit & Gym",
      category: "Fitness & Gym",
      description: "State-of-the-art strength training gym featuring certified coaches, HIIT zones, and body transformation plans.",
      address: "3rd Floor, Metro Mall, MG Road",
      city: "Gurugram",
      contactNumber: "9899001122",
      website: "https://ironpulsefitness.com",
      openingHours: "06:00 AM - 10:00 PM",
      rating: 4.9,
      status: "ACTIVE"
    },
    services: [
      { name: "1-on-1 Personal Training Session", description: "Custom workout regimen and form coaching with a senior master trainer.", price: 699, duration: 60 },
      { name: "HIIT & Functional Circuit Class", description: "High-intensity calorie-burning circuit training in an energetic group.", price: 400, duration: 45 },
      { name: "Comprehensive Body Fat & Nutrition Assessment", description: "InBody bioimpedance scan and personalized macro meal guidance.", price: 500, duration: 30 }
    ]
  },
  {
    owner: { name: "Ananya Iyer", email: "gym2@gmail.com" },
    business: {
      name: "Zenith Yoga & Pilates Studio",
      category: "Fitness & Gym",
      description: "Holistic yoga sanctuary teaching Hatha, Vinyasa, Pranayama, and core reformer Pilates in a serene atmosphere.",
      address: "Villa 8, Jubilee Hills",
      city: "Hyderabad",
      contactNumber: "9848123456",
      website: "https://zenithyoga.in",
      openingHours: "06:30 AM - 08:30 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Guided Hatha & Vinyasa Yoga Session", description: "Asana alignment, deep breathing, and guided meditation session.", price: 450, duration: 60 },
      { name: "Reformer Pilates Core Workout", description: "Resistance reformer training targeting posture and core stability.", price: 850, duration: 50 },
      { name: "Stress Relief Meditation & Sound Bath", description: "Tibetan sound bowl resonance therapy for mental relaxation.", price: 600, duration: 45 }
    ]
  },

  // 4. RESTAURANTS & CAFES
  {
    owner: { name: "Karan Malhotra", email: "cafe1@gmail.com" },
    business: {
      name: "Urban Tadka Fine Dining",
      category: "Restaurants & Cafes",
      description: "Authentic North Indian and Mughlai specialty restaurant offering family table bookings and gourmet dining experiences.",
      address: "Shop 5, Connaught Place Outer Circle",
      city: "Delhi",
      contactNumber: "9811445566",
      website: "https://urbantadka.co.in",
      openingHours: "12:00 PM - 11:30 PM",
      rating: 4.7,
      status: "ACTIVE"
    },
    services: [
      { name: "Chef's 4-Course Tasting Dinner (Table of 2)", description: "Curated multi-course royal North Indian dinner pairing.", price: 1800, duration: 90 },
      { name: "Family Feast Table Reservation (Table of 4)", description: "Reserved premium booth seating with complimentary starters.", price: 2800, duration: 120 },
      { name: "Weekend Lunch Buffet Experience", description: "Unlimited live tandoor starters, main course, and artisanal desserts.", price: 899, duration: 75 }
    ]
  },
  {
    owner: { name: "Simran Kaur", email: "cafe2@gmail.com" },
    business: {
      name: "The Artisan Roast & Bakery",
      category: "Restaurants & Cafes",
      description: "Chic neighborhood cafe featuring freshly roasted single-origin specialty coffees, French sourdough, and desserts.",
      address: "Plot 19, Koregaon Park Lane 7",
      city: "Pune",
      contactNumber: "9820556677",
      website: "https://artisanroast.com",
      openingHours: "08:00 AM - 10:00 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Artisanal Coffee & Breakfast Combo", description: "Choice of pour-over specialty brew with freshly baked croissant.", price: 350, duration: 45 },
      { name: "High Tea & Pastry Tasting for Two", description: "Selection of hand-crafted mini pastries, tarts, and rare estate teas.", price: 750, duration: 60 },
      { name: "Coffee Brewing Masterclass & Tasting", description: "Hands-on AeroPress and V60 manual brewing workshop.", price: 999, duration: 75 }
    ]
  },

  // 5. HOME SERVICES
  {
    owner: { name: "Ramesh Kumar", email: "home1@gmail.com" },
    business: {
      name: "QuickFix Electrical & Appliance Repair",
      category: "Home Services",
      description: "Reliable home electrical repairs, AC servicing, plumbing maintenance, and home appliance diagnosis at your doorstep.",
      address: "Block C, Sector 62",
      city: "Noida",
      contactNumber: "9818889900",
      website: "https://quickfixrepairs.in",
      openingHours: "08:00 AM - 08:00 PM",
      rating: 4.6,
      status: "ACTIVE"
    },
    services: [
      { name: "Split AC Deep Foam Cleaning & Service", description: "High-pressure pump wash, indoor/outdoor coil clean and gas check.", price: 599, duration: 60 },
      { name: "Complete Home Electrical Inspection", description: "MCB testing, grounding check, socket testing, and load inspection.", price: 399, duration: 45 },
      { name: "Emergency Plumbing Leak Fix & Tap Repair", description: "Rapid doorstep plumbing repair for pipes, faucets, and drain traps.", price: 350, duration: 40 }
    ]
  },
  {
    owner: { name: "Sunil Sharma", email: "home2@gmail.com" },
    business: {
      name: "SparkleClean Deep Home Care",
      category: "Home Services",
      description: "Professional residential cleaning, sofa shampooing, modular kitchen degreasing, and sanitized bathroom scrub.",
      address: "14th Main, HSR Layout Sector 2",
      city: "Bengaluru",
      contactNumber: "9845778899",
      website: "https://sparkleclean.co",
      openingHours: "08:30 AM - 07:00 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "2BHK / 3BHK Full Home Deep Cleaning", description: "Floor buffing, balcony wash, window glass cleaning, and cobweb removal.", price: 2999, duration: 180 },
      { name: "Intense Bathroom Sanitization & Descaling", description: "Tiles acid wash, stain descaling, tap buffing, and mirror cleaning.", price: 599, duration: 60 },
      { name: "Sofa & Upholstery Foam Shampooing", description: "Wet vacuum extraction, fabric stain removal, and aroma deodorizing.", price: 799, duration: 60 }
    ]
  },

  // 6. AUTOMOBILE CARE
  {
    owner: { name: "Mohit Chawla", email: "auto1@gmail.com" },
    business: {
      name: "SpeedyWheels Car Wash & Detailing",
      category: "Automobile Care",
      description: "Modern auto garage offering touchless ceramic wash, 3M paint polishing, interior vacuuming, and general car maintenance.",
      address: "Plot 88, Udyog Vihar Phase 5",
      city: "Gurugram",
      contactNumber: "9810334411",
      website: "https://speedywheels.in",
      openingHours: "08:00 AM - 08:00 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Foam Wash & Underbody Pressure Clean", description: "Snow foam wash, underbody chassis blast, alloy wheel degreasing.", price: 499, duration: 45 },
      { name: "Complete Interior Steam Spa & Dry Clean", description: "Seat shampoo, roof liner cleaning, dashboard polish and AC vent steam.", price: 1499, duration: 90 },
      { name: "Teflon Paint Polish & Gloss Protection", description: "Machine buffer polish, swirl mark reduction, and hydrophobic coating.", price: 1999, duration: 90 }
    ]
  },
  {
    owner: { name: "Deepak Yadav", email: "auto2@gmail.com" },
    business: {
      name: "MotoCraft Two-Wheeler Workshop",
      category: "Automobile Care",
      description: "Certified bike and scooter repair clinic with genuine spare parts, carburetor tuning, engine oil change, and brake overhaul.",
      address: "Shop 3, Main Market, Lajpat Nagar 4",
      city: "Delhi",
      contactNumber: "9891223344",
      website: "https://motocraftgarage.com",
      openingHours: "09:00 AM - 08:30 PM",
      rating: 4.7,
      status: "ACTIVE"
    },
    services: [
      { name: "Two-Wheeler Full Periodic Service", description: "Engine oil change, chain lube, brake check, spark plug clean, and wash.", price: 650, duration: 60 },
      { name: "Front & Rear Disc Brake Service", description: "Brake pad inspection, disc bleed, and caliper cleaning.", price: 350, duration: 30 },
      { name: "Carburetor & Fuel Injector Ultrasonic Tuning", description: "Complete throttle body cleaning for superior mileage and pickup.", price: 450, duration: 45 }
    ]
  },

  // 7. EDUCATION & CLASSES
  {
    owner: { name: "Neha Saxena", email: "edu1@gmail.com" },
    business: {
      name: "Apex Scholars Academy",
      category: "Education & Classes",
      description: "Top-rated learning center for STEM subjects, board exams preparation, coding for kids, and language enhancement.",
      address: "A-50, Sector 15, Near Metro Station",
      city: "Noida",
      contactNumber: "9811882233",
      website: "https://apexscholars.edu.in",
      openingHours: "10:00 AM - 08:00 PM",
      rating: 4.9,
      status: "ACTIVE"
    },
    services: [
      { name: "1-on-1 Academic Counseling & Diagnostic Test", description: "Student learning gap assessment, roadmap creation, and syllabus guidance.", price: 300, duration: 45 },
      { name: "Mathematics & Science Doubt Clearing Session", description: "Specialized problem solving and concept mastery with a senior tutor.", price: 500, duration: 60 },
      { name: "Python Coding & AI for Beginners (Trial Class)", description: "Interactive hands-on programming workshop building a mini project.", price: 400, duration: 60 }
    ]
  },
  {
    owner: { name: "Aditya Sen", email: "edu2@gmail.com" },
    business: {
      name: "Harmony School of Music & Arts",
      category: "Education & Classes",
      description: "Vibrant creative studio teaching acoustic guitar, keyboard, Indian classical vocals, and acrylic fine arts.",
      address: "Flat 2B, Park Street",
      city: "Kolkata",
      contactNumber: "9830112233",
      website: "https://harmonymusic.org",
      openingHours: "11:00 AM - 08:00 PM",
      rating: 4.8,
      status: "ACTIVE"
    },
    services: [
      { name: "Acoustic Guitar Introductory Masterclass", description: "Fretboard fundamentals, basic open chords, and strumming rhythm.", price: 450, duration: 45 },
      { name: "Electronic Keyboard & Piano Lesson", description: "Music theory, sight reading, and finger independence drills.", price: 500, duration: 50 },
      { name: "Vocal Warmup & Classical Raga Basics", description: "Voice projection techniques, breath control, and swar practice.", price: 400, duration: 45 }
    ]
  },

  // 8. PROFESSIONAL
  {
    owner: { name: "CA Manish Bansal", email: "pro1@gmail.com" },
    business: {
      name: "Bansal & Associates Financial Advisors",
      category: "Professional",
      description: "Trusted chartered accountants offering GST filing, income tax returns, company incorporation, and business audit services.",
      address: "Office 402, World Trade Tower, Barakhamba Road",
      city: "Delhi",
      contactNumber: "9811556677",
      website: "https://bansaladvisors.com",
      openingHours: "10:00 AM - 06:30 PM",
      rating: 4.9,
      status: "ACTIVE"
    },
    services: [
      { name: "Income Tax Return (ITR) Filing & Tax Planning", description: "Complete tax liability calculation, deduction optimization, and filing.", price: 999, duration: 45 },
      { name: "New Company Incorporation & Startup Advisory", description: "Step-by-step Private Limited / LLP registration and legal roadmap.", price: 2499, duration: 60 },
      { name: "GST Compliance & Monthly Return Audit", description: "Input tax credit reconciliation and quarterly filing consultation.", price: 1200, duration: 45 }
    ]
  },
  {
    owner: { name: "Ar. Priya Nair", email: "pro2@gmail.com" },
    business: {
      name: "Studio Canvas Interior Architecture",
      category: "Professional",
      description: "Contemporary architectural design, bespoke residential interiors, 3D space planning, and modular wardrobe consultation.",
      address: "Suite 101, Bandra Kurla Complex",
      city: "Mumbai",
      contactNumber: "9820990011",
      website: "https://studiocanvas.in",
      openingHours: "10:00 AM - 07:00 PM",
      rating: 4.9,
      status: "ACTIVE"
    },
    services: [
      { name: "Home Interior Space Planning & Layout Consultation", description: "Walkthrough of floor plans, spatial optimization, and furniture layout.", price: 1500, duration: 60 },
      { name: "3D Modular Kitchen & Wardrobe Design Concept", description: "Custom 3D photorealistic design preview with material swatch selection.", price: 2000, duration: 75 },
      { name: "Site Feasibility Inspection & Renovation Estimate", description: "On-site assessment of civil changes, electrical points, and budget forecast.", price: 1200, duration: 60 }
    ]
  }
];

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for business seeding...");

    const hashedPassword = await bcrypt.hash("123456", 10);
    let seededCount = 0;

    for (const item of businessesData) {
      const { owner, business, services } = item;

      // 1. Find or create User
      let user = await User.findOne({ email: owner.email });
      if (!user) {
        user = await User.create({
          name: owner.name,
          email: owner.email,
          password: hashedPassword,
          role: "BUSINESS_OWNER"
        });
        console.log(`Created Owner Account: ${owner.email} (${owner.name})`);
      } else {
        // Ensure password is 123456 and role is BUSINESS_OWNER
        user.password = hashedPassword;
        user.role = "BUSINESS_OWNER";
        await user.save();
        console.log(`Updated Existing Owner: ${owner.email}`);
      }

      // 2. Find or create Business
      let biz = await Business.findOne({ ownerId: user._id });
      if (!biz) {
        biz = await Business.create({
          ...business,
          ownerId: user._id
        });
        console.log(`Created Business: "${biz.name}" [Category: ${biz.category}] in ${biz.city}`);
      } else {
        Object.assign(biz, business);
        await biz.save();
        console.log(`Updated Business: "${biz.name}"`);
      }

      // 3. Create Services
      for (const srv of services) {
        const existingSrv = await BusinessService.findOne({
          businessId: biz._id,
          name: srv.name
        });
        if (!existingSrv) {
          await BusinessService.create({
            ...srv,
            businessId: biz._id,
            isActive: true
          });
        }
      }

      // 4. Create 7-Day Availability
      for (const day of DAYS) {
        const existingAvail = await BusinessAvailability.findOne({
          businessId: biz._id,
          day
        });
        if (!existingAvail) {
          await BusinessAvailability.create({
            businessId: biz._id,
            day,
            isOpen: true,
            openingTime: "09:00",
            closingTime: "20:00"
          });
        }
      }

      seededCount++;
    }

    console.log(`\nSUCCESS! Successfully verified and seeded ${seededCount} businesses across all 8 categories!`);
    console.log("All accounts have password: '123456'");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
