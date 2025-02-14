import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Retrieves a list of tasks for a given subject, sorted as they appear in !tugas.
 *
 * @param {string} subject - The subject to get tasks for.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths.
 */
export const getSortedTasks = async (subject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mapelDir = path.resolve(__dirname, '..', 'function', 'mapel');
    const subjectPath = path.join(mapelDir, subject);

    if (!fs.existsSync(subjectPath)) {
        return [];
    }

    return new Promise((resolve, reject) => {
        fs.readdir(subjectPath, (err, files) => {
            if (err) {
                console.error(`Error reading subject directory ${subject}:`, err);
                reject(err);
                return;
            }

            // Sort files by date (newest first)
            files.sort((a, b) => {
                const dateA = parse(path.basename(a, '.json'), 'dd-MM-yyyy', new Date());
                const dateB = parse(path.basename(b, '.json'), 'dd-MM-yyyy', new Date());
                return dateB - dateA; // Newest first
            });

            const fullPaths = files.map(file => path.join(subjectPath, file));
            resolve(fullPaths);
        });
    });
};

/**
 * Retrieves a list of tasks for all subjects and formats the data.
 *
 * @returns {Promise<object>} - A promise that resolves to an object where keys are subjects and values are arrays of task objects.
 */
export const getAllSortedTasks = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mapelDir = path.resolve(__dirname, '..', 'function', 'mapel');

    return new Promise((resolve, reject) => {
        fs.readdir(mapelDir, { withFileTypes: true }, (err, subjects) => {
            if (err) {
                console.error('Error reading mapel directory:', err);
                reject(err);
                return;
            }

            const subjectGroups = {};
            subjects.forEach(subject => {
                if (subject.isDirectory()) {
                    subjectGroups[subject.name] = [];
                }
            });

            const promises = [];

            subjects.forEach(subject => {
                if (subject.isDirectory()) {
                    const subjectPath = path.join(mapelDir, subject.name);
                    const promise = new Promise((resolveSubject) => {
                        fs.readdir(subjectPath, (err, files) => {
                            if (err) {
                                console.error(`Error reading subject directory ${subject.name}:`, err);
                                resolveSubject();
                                return;
                            }

                            const filePromises = files.map(file => {
                                const filePath = path.join(subjectPath, file);
                                return new Promise((resolveFile) => {
                                    fs.readFile(filePath, 'utf8', (err, data) => {
                                        if (err) {
                                            console.error(`Error reading file ${filePath}:`, err);
                                            resolveFile(); // Resolve even on error
                                            return;
                                        }

                                        try {
                                            const jsonData = JSON.parse(data);
                                            const formattedDate = format(parse(jsonData.tugas_dibuat_pada, 'dd-MM-yyyy', new Date()), 'dd MMMM yyyy', { locale: id });
                                            subjectGroups[subject.name].push({
                                                formattedDate,
                                                jsonData
                                            });
                                        } catch (error) {
                                            console.error(`Error parsing JSON in file ${filePath}:`, error);
                                        }
                                        resolveFile(); // Resolve after processing each file
                                    });
                                });
                            });

                            Promise.all(filePromises).then(() => resolveSubject());
                        });
                    });
                    promises.push(promise);
                }
            });

            Promise.all(promises).then(() => {
                // Sort tasks within each subject group by date (newest first)
                for (const subject in subjectGroups) {
                    subjectGroups[subject].sort((a, b) => {
                        const dateA = parse(a.jsonData.tugas_dibuat_pada, 'dd-MM-yyyy', new Date());
                        const dateB = parse(b.jsonData.tugas_dibuat_pada, 'dd-MM-yyyy', new Date());
                        return dateB - dateA;
                    });
                }
                resolve(subjectGroups);
            });
        });
    });
};
