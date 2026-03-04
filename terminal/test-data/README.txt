IRFlow Timeline TUI — Test Data Files
======================================

These files simulate a realistic DFIR incident for testing all TUI features.

Attack Scenario: Phishing → Macro → C2 → Discovery → Persistence →
                 Lateral Movement → Credential Theft → Data Exfil → Ransomware


FILES
-----

1. sysmon-process.csv (39 rows)
   Sysmon Event ID 1 (Process Create) data with full parent-child chains.
   Tests: Process Tree (P), Histogram (H), Stacking (S), Search, Color Rules

   Columns: UtcTime, ProcessId, ParentProcessId, Image, ParentImage,
            CommandLine, User, Computer, ProcessGuid, ParentProcessGuid,
            IntegrityLevel, EventID

   Attack chain visible:
   - explorer.exe → WINWORD.EXE → cmd.exe → powershell.exe (macro execution)
   - powershell.exe → whoami, ipconfig, net, nltest (discovery)
   - certutil → svc.exe (payload download + execution)
   - svc.exe → schtasks, reg.exe (persistence)
   - svc.exe → wmic, Invoke-Command (lateral movement)
   - svc.exe → vssadmin, bcdedit, wbadmin (anti-recovery)
   - svc.exe → crypt.exe (ransomware)
   - svc.exe → rundll32 → mshta (LOLBin chain)
   - svc.exe → Invoke-Mimikatz, procdump lsass (credential theft)


2. logon-events.csv (36 rows)
   Windows Security Event IDs 4624/4625/4634/4647/4648/4672/4778.
   Tests: Lateral Movement (L), Gap Analysis (Ctrl+G), Checkbox Filter

   Columns: TimeCreated, EventID, Computer, IpAddress, TargetUserName,
            TargetDomainName, LogonType, WorkstationName, SubjectUserName,
            ClientName, ClientAddress, Channel

   Features:
   - Multi-hop lateral movement: WORKSTATION01 → DC01 → FILESERVER01 → SQLSERVER01
   - Failed logon spray (4625) before success
   - RDP session (4778) from external IP
   - Suspicious account: admin_backdoor (logon type 3)
   - 3.5-hour gap (06:30 → 10:00) visible in Gap Analysis


3. persistence-evtx.csv (20 rows)
   Mixed Windows Event Log data (Security, Sysmon, System, WMI-Activity).
   Tests: Persistence Analysis (A), Stacking (S), Filter

   Columns: TimeCreated, EventID, Channel, Computer, MapDescription,
            PayloadData1-6, UserName

   Persistence mechanisms present:
   - Scheduled task (EventID 4698)
   - Registry Run key (Sysmon 13)
   - Service install (7045)
   - IFEO debugger hijack (sethc.exe → cmd.exe)
   - Winlogon shell/userinit modification
   - WMI event subscription (Sysmon 19/20/21)
   - Defender disabled (registry + service)
   - Backdoor account created + added to Domain Admins
   - Audit log cleared (1102, 104)


4. timeline-gaps.csv (62 rows)
   Combined Sysmon + Security events as a unified timeline.
   Tests: Gap Analysis (Ctrl+G), Histogram (H), IOC Matcher (i)

   Columns: datetime, source, EventID, Computer, User, Description,
            SourceAddress, DestinationAddress

   Features:
   - Initial compromise burst: 06:10:00-06:10:20 (20+ events in 20 seconds)
   - 3.5-hour gap: 06:30 → 10:00 (attacker went quiet)
   - Second burst: 10:01:00-10:01:10 (lateral movement blitz)
   - Data exfil burst: 10:05:00-10:05:08 (rapid transfers)
   - Long gap: 10:10 → 18:00 (post-encryption silence)
   - C2 IPs and exfil IPs in data for IOC matching


5. iocs.txt (IOC indicator file — NOT a CSV)
   Use with IOC Matcher (i key): load this file to scan against any loaded CSV.

   Contains:
   - C2 IP addresses (185.220.101.42, 91.234.56.78)
   - Malicious domains (evil-c2.com, defanged variants)
   - Malicious filenames (beacon.exe, svc.exe, mimikatz.exe)
   - Suspicious accounts (admin_backdoor, attacker)
   - Regex patterns for MITRE techniques (certutil.*urlcache, etc.)


TESTING GUIDE
-------------

  # Load all files at once (multi-tab):
  node bin/irflow-tui.js test-data/sysmon-process.csv test-data/logon-events.csv test-data/persistence-evtx.csv test-data/timeline-gaps.csv

  # Then try:
  P         Process tree (best on tab 1: sysmon-process.csv)
  L         Lateral movement (best on tab 2: logon-events.csv)
  A         Persistence analysis (best on tab 3: persistence-evtx.csv)
  H         Histogram (works on all — shows event timeline)
  S         Stacking (works on all — frequency analysis per column)
  Ctrl+G    Gap analysis (best on tab 4: timeline-gaps.csv)
  i         IOC matcher (load test-data/iocs.txt against any tab)
  /         Search (try: powershell, evil-c2, mimikatz, admin_backdoor)
  f         Filter column (try on EventID, Computer, User)
  s         Sort column
  Enter     Detail panel (expand any row)
  Ctrl+T    Cycle themes (cyberpunk → matrix → ember → light)
  ?         Help overlay
