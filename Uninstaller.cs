using System;
using System.IO;
using System.Windows.Forms;
using System.Drawing;
using System.Diagnostics;
using System.Reflection;

namespace VisionGuard.Uninstaller
{
    public class UninstallerForm : Form
    {
        private Label lblTitle;
        private Label lblTagline;
        private Label lblDescription;
        private CheckBox chkWipeData;
        private Panel prgBarPanel;
        private int prgBarValue = 0;
        private Label lblStatus;
        private Button btnUninstall;
        private Button btnCancel;
        private Panel pnlHeader;

        private string installPath;
        private bool isCompleted = false;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new UninstallerForm());
        }

        public UninstallerForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            // Resolve active install directory
            installPath = AppDomain.CurrentDomain.BaseDirectory;

            // Form Settings
            this.Text = "VisionGuard Uninstaller";
            this.Size = new Size(480, 270);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = true;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(7, 9, 14); // Sleek Obsidian dark
            this.ForeColor = Color.FromArgb(248, 250, 252); // Off-white text

            // Header Banner Panel
            pnlHeader = new Panel();
            pnlHeader.Size = new Size(480, 65);
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.BackColor = Color.FromArgb(15, 19, 29); // Deep Slate Navy
            this.Controls.Add(pnlHeader);

            // Header Banner Bottom Line Glow
            Panel pnlHeaderLine = new Panel();
            pnlHeaderLine.Size = new Size(480, 2);
            pnlHeaderLine.Location = new Point(0, 63);
            pnlHeaderLine.BackColor = Color.FromArgb(244, 63, 94); // Glowing Rose Red border!
            pnlHeader.Controls.Add(pnlHeaderLine);

            // Title Label
            lblTitle = new Label();
            lblTitle.Text = "VisionGuard Uninstaller";
            lblTitle.Font = new Font("Segoe UI", 14, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(244, 63, 94); // Muted Red
            lblTitle.Location = new Point(16, 12);
            lblTitle.Size = new Size(400, 25);
            pnlHeader.Controls.Add(lblTitle);

            // Tagline Label
            lblTagline = new Label();
            lblTagline.Text = "Remove VisionGuard and healthy eye care configurations safely.";
            lblTagline.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblTagline.ForeColor = Color.FromArgb(100, 116, 139); // Muted Slate
            lblTagline.Location = new Point(17, 37);
            lblTagline.Size = new Size(400, 18);
            pnlHeader.Controls.Add(lblTagline);

            // Description Label
            lblDescription = new Label();
            lblDescription.Text = "This wizard will uninstall VisionGuard from your computer, cleaning up shortcuts and registry settings. Click Uninstall to proceed.";
            lblDescription.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblDescription.ForeColor = Color.FromArgb(203, 213, 225); // Slate light
            lblDescription.Location = new Point(16, 80);
            lblDescription.Size = new Size(440, 40);
            this.Controls.Add(lblDescription);

            // Wipe user data check box
            chkWipeData = new CheckBox();
            chkWipeData.Text = "Hapus semua data riwayat & pengaturan (settings.json, stats.json)";
            chkWipeData.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            chkWipeData.ForeColor = Color.FromArgb(203, 213, 225);
            chkWipeData.Checked = true;
            chkWipeData.Location = new Point(18, 128);
            chkWipeData.Size = new Size(440, 24);
            this.Controls.Add(chkWipeData);

            // Progress Bar Panel
            prgBarPanel = new Panel();
            prgBarPanel.Location = new Point(16, 160);
            prgBarPanel.Size = new Size(440, 12); // Sleek modern thin line
            prgBarPanel.Visible = false;
            prgBarPanel.Paint += (s, e) => {
                Graphics g = e.Graphics;
                // Draw background
                using (Brush bgBrush = new SolidBrush(Color.FromArgb(15, 19, 29)))
                {
                    g.FillRectangle(bgBrush, prgBarPanel.ClientRectangle);
                }
                // Draw fill
                if (prgBarValue > 0)
                {
                    int fillWidth = (int)((prgBarValue / 100.0) * prgBarPanel.Width);
                    if (fillWidth > 0)
                    {
                        using (Brush fillBrush = new SolidBrush(Color.FromArgb(244, 63, 94))) // Rose Red
                        {
                            g.FillRectangle(fillBrush, new Rectangle(0, 0, fillWidth, prgBarPanel.Height));
                        }
                    }
                }
                // Draw border
                using (Pen borderPen = new Pen(Color.FromArgb(30, 41, 59), 1))
                {
                    g.DrawRectangle(borderPen, 0, 0, prgBarPanel.Width - 1, prgBarPanel.Height - 1);
                }
            };
            this.Controls.Add(prgBarPanel);

            // Progress Status Label
            lblStatus = new Label();
            lblStatus.Text = "Ready to uninstall.";
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Italic);
            lblStatus.ForeColor = Color.FromArgb(244, 63, 94);
            lblStatus.Location = new Point(16, 182);
            lblStatus.Size = new Size(440, 20);
            this.Controls.Add(lblStatus);

            // Horizontal Line
            Panel pnlLine = new Panel();
            pnlLine.Size = new Size(480, 1);
            pnlLine.Location = new Point(0, 202);
            pnlLine.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(pnlLine);

            // Uninstall Button
            btnUninstall = new Button();
            btnUninstall.Text = "Uninstall";
            btnUninstall.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnUninstall.BackColor = Color.FromArgb(244, 63, 94);
            btnUninstall.ForeColor = Color.White;
            btnUninstall.FlatStyle = FlatStyle.Flat;
            btnUninstall.FlatAppearance.BorderSize = 0;
            btnUninstall.Location = new Point(245, 212);
            btnUninstall.Size = new Size(100, 30);
            btnUninstall.Cursor = Cursors.Hand;
            btnUninstall.Click += BtnUninstall_Click;
            btnUninstall.MouseEnter += (s, e) => { if(!isCompleted) btnUninstall.BackColor = Color.FromArgb(251, 113, 133); };
            btnUninstall.MouseLeave += (s, e) => { if(!isCompleted) btnUninstall.BackColor = Color.FromArgb(244, 63, 94); };
            this.Controls.Add(btnUninstall);

            // Cancel Button
            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            btnCancel.ForeColor = Color.FromArgb(248, 250, 252);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(355, 212);
            btnCancel.Size = new Size(95, 30);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += BtnCancel_Click;
            btnCancel.MouseEnter += (s, e) => btnCancel.BackColor = Color.FromArgb(51, 65, 85);
            btnCancel.MouseLeave += (s, e) => btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(btnCancel);
        }

        private async void BtnUninstall_Click(object sender, EventArgs e)
        {
            if (isCompleted)
            {
                // Self delete and quit
                SelfDeleteAndExit();
                return;
            }

            // Lock controls
            chkWipeData.Enabled = false;
            btnUninstall.Enabled = false;
            btnCancel.Enabled = false;
            prgBarPanel.Visible = true;
            prgBarValue = 10;
            prgBarPanel.Invalidate();

            lblStatus.Text = "Initializing uninstallation pipeline...";
            await System.Threading.Tasks.Task.Delay(600);

            try
            {
                // 1. Close active VisionGuard application processes
                lblStatus.Text = "Closing active VisionGuard processes...";
                prgBarValue = 25;
                prgBarPanel.Invalidate();
                RunPowerShell("Stop-Process -Name VisionGuard -Force -ErrorAction SilentlyContinue");
                await System.Threading.Tasks.Task.Delay(500);

                // 2. Delete Shortcuts (.lnk files) from Desktop and Start Menu
                lblStatus.Text = "Removing desktop and start menu shortcuts...";
                prgBarValue = 45;
                prgBarPanel.Invalidate();
                string desktopFolder = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string startMenuFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

                string desktopLnk = Path.Combine(desktopFolder, "VisionGuard.lnk");
                string startMenuLnk = Path.Combine(startMenuFolder, "VisionGuard.lnk");

                if (File.Exists(desktopLnk)) File.Delete(desktopLnk);
                if (File.Exists(startMenuLnk)) File.Delete(startMenuLnk);
                await System.Threading.Tasks.Task.Delay(300);

                // 3. Remove Windows Add/Remove Programs registry entries
                lblStatus.Text = "Cleaning registry entry configurations...";
                prgBarValue = 65;
                prgBarPanel.Invalidate();
                string registryUninstallPath = @"HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\VisionGuard";
                RunPowerShell("Remove-Item -Path '" + registryUninstallPath + "' -Recurse -Force -ErrorAction SilentlyContinue");
                
                // Remove auto-start registry key if active
                string registryRunPath = @"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run";
                RunPowerShell("Remove-ItemProperty -Path '" + registryRunPath + "' -Name 'VisionGuard' -ErrorAction SilentlyContinue");
                await System.Threading.Tasks.Task.Delay(300);

                // 4. Wipe User data (settings.json, stats.json in AppData\Roaming\vision-guard) if checked
                if (chkWipeData.Checked)
                {
                    lblStatus.Text = "Wiping user settings and break history database...";
                    prgBarValue = 80;
                    prgBarPanel.Invalidate();
                    string roamingPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "vision-guard");
                    if (Directory.Exists(roamingPath))
                    {
                        Directory.Delete(roamingPath, true);
                    }
                    await System.Threading.Tasks.Task.Delay(400);
                }

                prgBarValue = 100;
                prgBarPanel.Invalidate();
                lblStatus.Text = "VisionGuard has been cleanly uninstalled!";
                lblStatus.ForeColor = Color.FromArgb(16, 185, 129); // Green emerald
                await System.Threading.Tasks.Task.Delay(400);

                isCompleted = true;
                btnUninstall.Text = "Finish";
                btnUninstall.BackColor = Color.FromArgb(16, 185, 129);
                btnUninstall.Enabled = true;
            }
            catch (Exception ex)
            {
                prgBarValue = 0;
                prgBarPanel.Invalidate();
                lblStatus.Text = "Uninstallation failed!";
                chkWipeData.Enabled = true;
                btnUninstall.Enabled = true;
                btnCancel.Enabled = true;

                MessageBox.Show("An error occurred during uninstallation:\n" + ex.Message, "Uninstallation Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnCancel_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }

        private void RunPowerShell(string script)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "powershell.exe";
                psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \"" + script.Replace("\"", "\\\"") + "\"";
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                if (p != null)
                {
                    p.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("PowerShell run failure: " + ex.Message);
            }
        }

        private void SelfDeleteAndExit()
        {
            // Self-deletion logic: Windows files cannot be deleted while their process is active!
            // We solve this by launching a hidden Cmd window which waits 1.5 seconds for this uninstaller process to exit,
            // then deletes the Uninstaller executable, and finally recursively deletes the parent folder installation directory cleanly.
            try
            {
                string cmdArguments = string.Format(
                    "/c timeout /t 2 /nobreak && del /f /q \"{0}\" && rd /s /q \"{1}\"",
                    Assembly.GetExecutingAssembly().Location,
                    installPath.TrimEnd('\\')
                );

                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", cmdArguments);
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Self delete initiation failure: " + ex.Message);
            }

            Application.Exit();
        }
    }
}
