/* React Seed App mock: services/common/appinit
 *
 * The JavaScript twin of appinit.sas, for the mock target's browser build and
 * for any deployment that runs without SAS. A browser has no SAS engine, so a
 * request for `services/common/appinit` is answered by this program instead of
 * the compiled .sas - and it answers the same webout, so the app cannot tell.
 *
 * The SAS service runs:
 *   proc sql; create table areas as select distinct area from mydb.springs;
 * over the dataset serviceinit.sas builds. Here the same rows come from
 * springs.json beside this file, which scripts/springs-data.js derives from
 * that datalines block - generated, not hand-copied, and checked in CI.
 */

const path = require('path')

/* weboutPath is <root>/sessions/s<n>/webout.txt and the drive sits beside the
 * sessions folder - the layout sasjs/server uses, which the browser host
 * mirrors. The program's own path names the application folder:
 * /Public/app/react-seed-app/services/common/appinit. */
const DRIVE_FILES = path.resolve(weboutPath, '..', '..', '..', 'drive', 'files')
const APP_LOC = String(_program).replace(/\/(services|jobs|tests)\/.*$/, '')
const SPRINGS_FILE = path.join(
  DRIVE_FILES,
  APP_LOC,
  'services',
  'common',
  'springs.json'
)

const springs = JSON.parse(fs.readFileSync(SPRINGS_FILE, 'utf-8'))

/* select distinct area - one row per area, ascending, with the column name the
 * SAS table carries (SAS uppercases it) */
const areas = []
const seen = new Set()

springs.forEach((row) => {
  if (seen.has(row.AREA)) return
  seen.add(row.AREA)
  areas.push({ AREA: row.AREA })
})

areas.sort((a, b) => (a.AREA < b.AREA ? -1 : a.AREA > b.AREA ? 1 : 0))

/* A mocked run reports a log, because the SAS Logs panel is part of what this
 * seed demonstrates and a JavaScript twin that wrote nothing leaves it empty.
 * The text is a fixture shared by the three twins (mock-sas-log.json); a run
 * reports the failure-shaped one half the time and a clean one the rest, so the
 * panel shows a log with something in it as well as a log with nothing. */
const reportMockLog = () => {
  const file = path.join(
    DRIVE_FILES,
    APP_LOC,
    'services',
    'common',
    'mock-sas-log.json'
  )
  const { noisy, clean } = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const lines = Math.random() < 0.5 ? noisy : clean

  lines.forEach((line) =>
    console.log(line.replaceAll('{{program}}', () => String(_program)))
  )
}

reportMockLog()

webout('OPEN')
webout('OBJ', 'areas', areas)
webout('CLOSE')
