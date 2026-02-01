/**
 * Utilities for creating course structure in test workspaces
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { SLIMAN_FILENAME, SLIDES_FILENAME } from '../../constants';

/**
 * Creates a complete course structure in the test workspace
 * @param tempDir - Path to the test workspace directory
 * @param courseName - Name of the course (default: 'test-course')
 * @param lectures - Optional array of lectures to create
 */
export async function createCourseStructure(
  tempDir: string, 
  courseName: string = 'test-course',
  lectures: Array<{ name: string, title: string }> = []
): Promise<void> {
  // Create sliman.json in root
  const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
  await fs.writeFile(slimanPath, JSON.stringify({ course_name: courseName }, null, 2));

  // Create course directory
  const courseDir = path.join(tempDir, courseName);
  await fs.mkdir(courseDir, { recursive: true });

  // Create slides.json in course directory
  const slidesPath = path.join(courseDir, SLIDES_FILENAME);
  const slidesConfig = {
    slides: lectures.map(lecture => ({
      name: lecture.name,
      title: lecture.title
    }))
  };
  await fs.writeFile(slidesPath, JSON.stringify(slidesConfig, null, 2));

  // Create slides directory with lectures
  const slidesDir = path.join(tempDir, 'slides');
  await fs.mkdir(slidesDir, { recursive: true });

  for (const lecture of lectures) {
    const lectureDir = path.join(slidesDir, lecture.name);
    await fs.mkdir(lectureDir, { recursive: true });
    
    // Create slides.md for each lecture
    const slidesFile = path.join(lectureDir, 'slides.md');
    await fs.writeFile(slidesFile, `---
title: ${lecture.title}
canvasWidth: 1280
routerMode: history
---

# ${lecture.title}

Slide content here.
`);
  }
}

/**
 * Creates a minimal course structure (only sliman.json)
 * @param tempDir - Path to the test workspace directory  
 * @param courseName - Name of the course (default: 'test-course')
 */
export async function createMinimalCourse(tempDir: string, courseName: string = 'test-course'): Promise<void> {
  const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
  await fs.writeFile(slimanPath, JSON.stringify({ course_name: courseName }, null, 2));
}

/**
 * Creates a course directory with slides.json but no lectures
 * @param tempDir - Path to the test workspace directory
 * @param courseName - Name of the course (default: 'test-course')
 */
export async function createCourseWithEmptySlides(tempDir: string, courseName: string = 'test-course'): Promise<void> {
  await createMinimalCourse(tempDir, courseName);
  
  const courseDir = path.join(tempDir, courseName);
  await fs.mkdir(courseDir, { recursive: true });

  const slidesPath = path.join(courseDir, SLIDES_FILENAME);
  const slidesConfig = { slides: [] };
  await fs.writeFile(slidesPath, JSON.stringify(slidesConfig, null, 2));
}

/**
 * Adds a lecture to existing course structure
 * @param tempDir - Path to the test workspace directory
 * @param lectureName - Name of the lecture to add
 * @param lectureTitle - Title of the lecture
 */
export async function addLectureToCourse(tempDir: string, lectureName: string, lectureTitle: string): Promise<void> {
  const slimanPath = path.join(tempDir, SLIMAN_FILENAME);
  const slimanContent = await fs.readFile(slimanPath, 'utf-8');
  const slimanConfig = JSON.parse(slimanContent);
  const courseName = slimanConfig.course_name;

  // Update slides.json
  const slidesPath = path.join(tempDir, courseName, SLIDES_FILENAME);
  let slidesConfig: { slides: Array<{ name: string, title: string }> } = { slides: [] };
  
  try {
    const slidesContent = await fs.readFile(slidesPath, 'utf-8');
    slidesConfig = JSON.parse(slidesContent);
  } catch {
    // File doesn't exist, use empty config
  }
  
  slidesConfig.slides.push({ name: lectureName, title: lectureTitle });
  await fs.writeFile(slidesPath, JSON.stringify(slidesConfig, null, 2));

  // Create lecture directory and slides.md
  const slidesDir = path.join(tempDir, 'slides');
  await fs.mkdir(slidesDir, { recursive: true });
  
  const lectureDir = path.join(slidesDir, lectureName);
  await fs.mkdir(lectureDir, { recursive: true });
  
  const slidesFile = path.join(lectureDir, 'slides.md');
  await fs.writeFile(slidesFile, `---
title: ${lectureTitle}
canvasWidth: 1280
routerMode: history
---

# ${lectureTitle}

Slide content here.
`);
}