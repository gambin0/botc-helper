import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface JinxEntry {
  id: string;
  jinx: {
    id: string;
    reason: string;
  }[];
}

export interface JinxResult {
  isJinxed: boolean;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class JinxesService {
  private http = inject(HttpClient);
  private jinxes$: Observable<JinxEntry[]> | null = null;

  /**
   * Get the jinxes data as an observable.
   * Caches the observable so the file is only fetched once.
   */
  getJinxes(): Observable<JinxEntry[]> {
    if (!this.jinxes$) {
      this.jinxes$ = this.http.get<JinxEntry[]>('assets/data/jinxes.json');
    }
    return this.jinxes$;
  }

  /**
   * Check if two characters are jinxed (incompatible).
   * @returns Observable<JinxResult> with isJinxed flag and optional reason
   */
  checkJinx(char1Id: string, char2Id: string): Observable<JinxResult> {
    return this.getJinxes().pipe(
      map(jinxes => {
        // Check if char1 jinxes char2
        const char1Entry = jinxes.find(j => j.id === char1Id);
        if (char1Entry) {
          const jinx = char1Entry.jinx.find(j => j.id === char2Id);
          if (jinx) {
            return { isJinxed: true, reason: jinx.reason };
          }
        }

        // Check if char2 jinxes char1
        const char2Entry = jinxes.find(j => j.id === char2Id);
        if (char2Entry) {
          const jinx = char2Entry.jinx.find(j => j.id === char1Id);
          if (jinx) {
            return { isJinxed: true, reason: jinx.reason };
          }
        }

        return { isJinxed: false };
      })
    );
  }

  /**
   * Validate a script for jinxes.
   * @param characterIds Array of character IDs in the script
   * @returns Observable<JinxResult[]> with all jinxes found
   */
  validateScript(characterIds: string[]): Observable<JinxResult[]> {
    return this.getJinxes().pipe(
      map(jinxes => {
        const results: JinxResult[] = [];
        const seen = new Set<string>();

        for (let i = 0; i < characterIds.length; i++) {
          for (let j = i + 1; j < characterIds.length; j++) {
            const id1 = characterIds[i];
            const id2 = characterIds[j];
            const pairKey = [id1, id2].sort().join('-');

            if (seen.has(pairKey)) {
              continue;
            }
            seen.add(pairKey);

            // Check if id1 jinxes id2
            const entry1 = jinxes.find(j => j.id === id1);
            if (entry1) {
              const jinx = entry1.jinx.find(j => j.id === id2);
              if (jinx) {
                results.push({ isJinxed: true, reason: `${id1} and ${id2}: ${jinx.reason}` });
                continue;
              }
            }

            // Check if id2 jinxes id1
            const entry2 = jinxes.find(j => j.id === id2);
            if (entry2) {
              const jinx = entry2.jinx.find(j => j.id === id1);
              if (jinx) {
                results.push({ isJinxed: true, reason: `${id1} and ${id2}: ${jinx.reason}` });
              }
            }
          }
        }

        return results;
      })
    );
  }
}
