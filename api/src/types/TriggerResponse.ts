/**
 * Response of the two trigger endpoints, `POST /SASjsApi/code/trigger` and
 * `POST /SASjsApi/stp/trigger`.
 *
 * One type rather than one per endpoint: they answer the same question (did the
 * program start, and how do I find it), so a divergence between them would be a
 * defect in the published contract rather than a distinction.
 */
export interface TriggerResponse {
  /**
   * `sessionId` is the ID of the session and the name of the temporary folder
   * used to store the program's outputs.<br><br>
   * For SAS, this would be the location of the SASWORK folder.<br><br>
   * `sessionId` can be used to poll session state using the
   * GET /SASjsApi/session/{sessionId}/state endpoint.
   * @example "20241028074744-54132-1730101664824"
   */
  sessionId: string
  /**
   * OS process id of the process running the program: the SAS binary for the
   * `sas` runtime, or the interpreter for `js`/`py`/`r`.<br><br>
   * Omitted for the `sasviya` runtime, where the program runs on the Viya
   * server and no local process exists. Also omitted if the process has not
   * started yet, which the endpoint waits briefly for.<br><br>
   * The value identifies the process for as long as it runs: it is cleared when
   * the session finishes, because operating systems recycle pids and a stale id
   * can name an unrelated process. Use it while the session is running, and
   * poll GET /SASjsApi/session/{sessionId}/state for completion rather than
   * watching the pid afterwards.
   * @isInt
   * @example 12345
   */
  pid?: number
}
