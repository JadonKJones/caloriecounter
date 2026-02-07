

# Project Roadmap: All-in-One Fitness & Nutrition App

A comprehensive full-stack application for tracking caloric intake, biometric data, and strength training progression.

It should do everything I use MyNetDiary and Hevy for without me having to pay 120 dollars a year. I could buy so many cookies with that. Or like 2 Hori Taiko Drums.

## Technical Stack

* **Authentication & Database:** Supabase (PostgreSQL)
* **External APIs:** OpenFoodFacts API (2M+ entries)
* **Local Persistence:** Local Storage / IndexedDB (Offline-first caching for high-frequency logs)
* **Formulas:** * **1RM Estimation (Brzycki):** 
* **Maintenance TDEE:** Dynamic calculation based on weight delta vs. caloric intake.



---

## Calorie & Nutrition Tracker

### Core Features

* [ ] **Authentication System:** Secure sign-up/log-in via email and Google OAuth (Supabase Auth).
* [X] **Daily Nutrition Diary:** High-performance logging system with offline caching for mobile reliability.
* [X] **Global Food Database:** Integration with OpenFoodFacts for verified nutritional data.
* [ ] **Smart Caching:** Local persistence of the 500 most recent items and user-defined "Favorites."
* [ ] **Barcode Scanner:** Real-time UPC/EAN scanning for instant logging.
* [X] **Macro/Micro Tracking:** Monitoring of Calories, Fats, Carbohydrates, Protein, and Sodium.
* [ ] **Hydration Tracker:** Visual water intake logging with customizable daily targets.
* [ ] **Biometric Logging:** Tracking for body weight, height, body fat percentage, and specific circumference measurements (biceps, waist, etc.).
* [ ] **Data Visualization:** Integrated progress graphs for all tracked biometric metrics.

### Future Enhancements

* [ ] **Recipe Editor:** Create and save custom meals with automated macro-partitioning.
* [ ] **Health API Integration:** Two-way sync with Apple Health and Google Fit.
* [ ] **AI Recipe Importer:** URL-based scraping to instantly calculate nutrition facts from web recipes.
* [ ] **Advanced Micronutrients:** Support for 100+ vitamins and minerals.

---

## Exercise & Strength Tracker

### Core Features

* [ ] **Workout Engine:** Unlimited session logging with a relational schema for high-volume data.
* [ ] **Standardized Routines:** Built-in templates for PPL (Push/Pull/Legs), Full Body, and Bodyweight variations.
* [ ] **Serialized Workout Data:** Support for complex JSON-based set structures:
* *Format:* `{exercise: [{set, weight, reps, rest_time}]}`


* [ ] **Exercise Library:** Database of 50+ movements featuring animations and technical cues.
* [ ] **Automated Rest Timer:** Context-aware timers that trigger upon set completion.
* [ ] **One-Rep Max (1RM) Estimator:** Automatic calculation based on top-set performance.
* [ ] **Volume Analytics:** Visual representation of workload history and progression.
* [ ] **Cardio Tracking:** Dedicated run tracker for distance, pace, and time.

### Future Enhancements

* [ ] **Muscle Heatmap:** 7-day visual representation of localized muscle fatigue and recovery.
* [ ] **Advanced Set Labeling:** Classification for Warmups, Drop Sets, and Failure sets.
* [ ] **Plate Calculator:** Visual breakdown of barbell loading based on available equipment.
* [ ] **GPS Run Tracking:** Live distance calculation and route mapping via mobile sensors.

---

## Database Schema Design (Internal Notes)

| Table | Primary Keys/Foreign Keys | Purpose |
| --- | --- | --- |
| `profiles` | `id (uuid)` | User metadata and settings |
| `nutrition_logs` | `id, user_id` | Daily food entries linked to OpenFoodFacts IDs |
| `water_logs` | `id, user_id` | Timestamped hydration entries |
| `biometrics` | `id, user_id` | Weight, BF%, and measurements |
| `workouts` | `id, user_id` | Header table for workout sessions |
| `exercise_library` | `id` | Static data for animations and instructions |
| `run_logs` | `id, user_id` | GPS and pace data for cardio sessions |
