import type { AppConfig } from './types';
import { mmDdToDisplay, normalizeSpecialDateFormat } from './specialDates';

export type ConflictTab = 'exclusions' | 'specials' | 'categories' | 'libraries';

export type ConfigConflict = {
    id: string;
    severity: 'warning' | 'info';
    tabs: ConflictTab[];
    message: string;
};

const norm = (s: string) => s.trim();
const nonempty = (s: string) => !!norm(s);

/** Detect config overlaps that confuse pinning (exclusion vs specials/categories, etc.). */
export function findConfigConflicts(config: AppConfig): ConfigConflict[] {
    const conflicts: ConfigConflict[] = [];
    const exclusions = (config.exclusion_list || []).map(norm).filter(nonempty);
    const exclusionSet = new Set(exclusions);
    const regexes = config.regex_exclusion_patterns || [];
    const specials = config.special_collections || [];
    const dateFmt = normalizeSpecialDateFormat(config.special_date_format);
    const categoriesByLib = config.categories || {};
    const pinSlots = config.number_of_collections_to_pin || {};
    const randomMode = !!config.use_random_category_mode;

    // Duplicate exclusions
    const seenEx = new Set<string>();
    for (const name of exclusions) {
        if (seenEx.has(name)) {
            conflicts.push({
                id: `dup-exclusion:${name}`,
                severity: 'info',
                tabs: ['exclusions'],
                message: `"${name}" appears more than once in the exclusion list.`,
            });
        }
        seenEx.add(name);
    }

    // Invalid regex
    regexes.forEach((pattern, idx) => {
        const p = String(pattern || '').trim();
        if (!p) return;
        try {
            // eslint-disable-next-line no-new
            new RegExp(p);
        } catch {
            conflicts.push({
                id: `bad-regex:${idx}:${p}`,
                severity: 'warning',
                tabs: ['exclusions'],
                message: `Invalid regex exclusion: ${p}`,
            });
        }
    });

    // Special titles → which events
    const specialTitleMap = new Map<string, string[]>();
    specials.forEach((spec, idx) => {
        const label = `${mmDdToDisplay(spec.start_date || '', dateFmt)}–${mmDdToDisplay(spec.end_date || '', dateFmt)} (#${idx + 1})`;
        for (const raw of spec.collection_names || []) {
            const title = norm(raw);
            if (!title) continue;
            const list = specialTitleMap.get(title) || [];
            list.push(label);
            specialTitleMap.set(title, list);
        }
    });

    for (const [title, events] of specialTitleMap) {
        if (events.length > 1) {
            conflicts.push({
                id: `special-multi:${title}`,
                severity: 'info',
                tabs: ['specials'],
                message: `"${title}" is listed in ${events.length} special events (${events.join(', ')}).`,
            });
        }
        if (exclusionSet.has(title)) {
            conflicts.push({
                id: `excl-special:${title}`,
                severity: 'warning',
                tabs: ['exclusions', 'specials'],
                message: `"${title}" is both excluded and a special — it will never be pinned.`,
            });
        }
    }

    // Category titles per library
    for (const [lib, cats] of Object.entries(categoriesByLib)) {
        const titleToCats = new Map<string, string[]>();
        let pinSum = 0;

        (cats || []).forEach((cat, idx) => {
            const catName = norm(cat.category_name) || `Category #${idx + 1}`;
            const pinCount = Number(cat.pin_count) || 0;
            pinSum += pinCount;

            for (const raw of cat.collections || []) {
                const title = norm(raw);
                if (!title) continue;
                const list = titleToCats.get(title) || [];
                list.push(catName);
                titleToCats.set(title, list);
            }
        });

        for (const [title, catNames] of titleToCats) {
            if (catNames.length > 1) {
                conflicts.push({
                    id: `cat-dup:${lib}:${title}`,
                    severity: 'warning',
                    tabs: ['categories'],
                    message: `In "${lib}", "${title}" is in multiple categories: ${catNames.join(', ')}.`,
                });
            }
            if (exclusionSet.has(title)) {
                conflicts.push({
                    id: `excl-cat:${lib}:${title}`,
                    severity: 'warning',
                    tabs: ['exclusions', 'categories'],
                    message: `In "${lib}", "${title}" is excluded but still listed under a category — it will be skipped when pinning.`,
                });
            }
            if (specialTitleMap.has(title)) {
                conflicts.push({
                    id: `special-cat:${lib}:${title}`,
                    severity: 'info',
                    tabs: ['specials', 'categories'],
                    message: `In "${lib}", "${title}" is both a special and in a category. Specials take priority when active.`,
                });
            }
        }

        const slots = Number(pinSlots[lib]) || 0;
        if (cats && cats.length > 0 && slots > 0) {
            if (!randomMode && pinSum > slots) {
                conflicts.push({
                    id: `pin-sum:${lib}`,
                    severity: 'warning',
                    tabs: ['categories', 'libraries'],
                    message: `In "${lib}", category pin counts sum to ${pinSum} but the library only allows ${slots} pins.`,
                });
            }
            if (randomMode) {
                (cats || []).forEach((cat, idx) => {
                    const pinCount = Number(cat.pin_count) || 0;
                    if (pinCount > slots) {
                        const catName = norm(cat.category_name) || `Category #${idx + 1}`;
                        conflicts.push({
                            id: `pin-cat:${lib}:${idx}`,
                            severity: 'warning',
                            tabs: ['categories', 'libraries'],
                            message: `In "${lib}", "${catName}" asks for ${pinCount} pins but the library only allows ${slots}.`,
                        });
                    }
                });
            }
        }
    }

    // Titles that match a regex exclusion AND appear in categories/specials
    const compiled: RegExp[] = [];
    for (const pattern of regexes) {
        const p = String(pattern || '').trim();
        if (!p) continue;
        try {
            compiled.push(new RegExp(p));
        } catch {
            /* already reported */
        }
    }
    if (compiled.length) {
        const checkTitle = (title: string, where: string, tabs: ConflictTab[]) => {
            for (const re of compiled) {
                if (re.test(title)) {
                    conflicts.push({
                        id: `regex-hit:${where}:${title}:${re.source}`,
                        severity: 'warning',
                        tabs,
                        message: `"${title}" (${where}) matches regex exclusion /${re.source}/ and will be skipped.`,
                    });
                    return;
                }
            }
        };
        for (const title of specialTitleMap.keys()) {
            checkTitle(title, 'special', ['exclusions', 'specials']);
        }
        for (const [lib, cats] of Object.entries(categoriesByLib)) {
            for (const cat of cats || []) {
                for (const raw of cat.collections || []) {
                    const title = norm(raw);
                    if (title) checkTitle(title, `category in ${lib}`, ['exclusions', 'categories']);
                }
            }
        }
    }

    // Deduplicate by id
    const byId = new Map<string, ConfigConflict>();
    for (const c of conflicts) {
        if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return Array.from(byId.values());
}

export function conflictsForTab(conflicts: ConfigConflict[], tab: string): ConfigConflict[] {
    return conflicts.filter(c => c.tabs.includes(tab as ConflictTab));
}
