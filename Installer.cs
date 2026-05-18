using System;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using System.Drawing;
using System.IO.Compression;
using System.Diagnostics;
using System.Threading.Tasks;

namespace VisionGuard.Installer
{
    public class SetupTranslation
    {
        public string Title;
        public string Tagline;
        public string Description;
        public string DestFolder;
        public string Browse;
        public string Install;
        public string Cancel;
        public string Close;
        public string Finish;
        public string Ready;
        public string Closing;
        public string Preparing;
        public string Extracting;
        public string Shortcuts;
        public string Success;
        public string Fail;
    }

    public class LanguageForm : Form
    {
        private Label lblPrompt;
        private ComboBox cmbLang;
        private Button btnOk;
        private Button btnCancel;
        public string SelectedLang { get; private set; }

        public LanguageForm()
        {
            SelectedLang = "id"; // Default

            this.Text = "VisionGuard Setup Language";
            this.Size = new Size(320, 180);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(7, 9, 14); // Sleek Obsidian dark
            this.ForeColor = Color.FromArgb(248, 250, 252);

            lblPrompt = new Label();
            lblPrompt.Text = "Pilih bahasa instalasi / Select setup language:";
            lblPrompt.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblPrompt.Location = new Point(16, 20);
            lblPrompt.Size = new Size(280, 20);
            this.Controls.Add(lblPrompt);

            cmbLang = new ComboBox();
            cmbLang.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbLang.BackColor = Color.FromArgb(15, 19, 29);
            cmbLang.ForeColor = Color.FromArgb(248, 250, 252);
            cmbLang.FlatStyle = FlatStyle.Flat;
            cmbLang.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            cmbLang.Location = new Point(16, 50);
            cmbLang.Size = new Size(272, 25);
            cmbLang.Items.Add("Bahasa Indonesia 🇮🇩");
            cmbLang.Items.Add("English 🇬🇧");
            cmbLang.Items.Add("Español 🇪🇸");
            cmbLang.Items.Add("日本語 🇯🇵");
            cmbLang.SelectedIndex = 0; // Default
            this.Controls.Add(cmbLang);

            btnOk = new Button();
            btnOk.Text = "OK";
            btnOk.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            btnOk.BackColor = Color.FromArgb(16, 185, 129);
            btnOk.ForeColor = Color.White;
            btnOk.FlatStyle = FlatStyle.Flat;
            btnOk.FlatAppearance.BorderSize = 0;
            btnOk.Location = new Point(100, 95);
            btnOk.Size = new Size(85, 28);
            btnOk.Cursor = Cursors.Hand;
            btnOk.Click += (s, e) => {
                if (cmbLang.SelectedIndex == 0) SelectedLang = "id";
                else if (cmbLang.SelectedIndex == 1) SelectedLang = "en";
                else if (cmbLang.SelectedIndex == 2) SelectedLang = "es";
                else if (cmbLang.SelectedIndex == 3) SelectedLang = "ja";
                this.DialogResult = DialogResult.OK;
                this.Close();
            };
            this.Controls.Add(btnOk);

            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            btnCancel.ForeColor = Color.FromArgb(248, 250, 252);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(195, 95);
            btnCancel.Size = new Size(85, 28);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += (s, e) => {
                this.DialogResult = DialogResult.Cancel;
                this.Close();
            };
            this.Controls.Add(btnCancel);
        }
    }

    public class InstallerForm : Form
    {
        private Label lblTitle;
        private Label lblTagline;
        private Label lblDescription;
        private Label lblFolder;
        private TextBox txtFolder;
        private Button btnBrowse;
        private Panel prgBarPanel;
        private int prgBarValue = 0;
        private Label lblStatus;
        private Button btnInstall;
        private Button btnCancel;
        private Panel pnlHeader;

        private string defaultInstallPath;
        private bool isCompleted = false;

        private SetupTranslation t;
        private string currentLang;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            using (LanguageForm langForm = new LanguageForm())
            {
                if (langForm.ShowDialog() == DialogResult.OK)
                {
                    Application.Run(new InstallerForm(langForm.SelectedLang));
                }
            }
        }

        public InstallerForm(string lang)
        {
            currentLang = lang;
            LoadTranslations(lang);
            InitializeComponent();
        }

        private void LoadTranslations(string lang)
        {
            t = new SetupTranslation();
            if (lang == "en")
            {
                t.Title = "VisionGuard Setup Wizard";
                t.Tagline = "Premium 20-20-20 Rule Break Reminder for Windows";
                t.Description = "This wizard will install VisionGuard on your computer. It will configure desktop shortcuts and add VisionGuard to your start menu for healthy eye care reminders.";
                t.DestFolder = "Destination Folder:";
                t.Browse = "Browse...";
                t.Install = "Install";
                t.Cancel = "Cancel";
                t.Close = "Close";
                t.Finish = "Finish & Launch";
                t.Ready = "Ready to install.";
                t.Closing = "Closing active VisionGuard processes...";
                t.Preparing = "Preparing installation directory...";
                t.Extracting = "Extracting software package files (this may take a few seconds)...";
                t.Shortcuts = "Creating desktop and start menu shortcuts...";
                t.Success = "Installation completed successfully!";
                t.Fail = "Installation failed!";
            }
            else if (lang == "es")
            {
                t.Title = "Asistente de VisionGuard";
                t.Tagline = "Recordatorio Premium de la Regla 20-20-20 para Windows";
                t.Description = "Este asistente instalará VisionGuard en su computadora. Configurará accesos directos en el escritorio y en el menú de inicio para recordatorios saludables del cuidado de la vista.";
                t.DestFolder = "Carpeta de Destino:";
                t.Browse = "Examinar...";
                t.Install = "Instalar";
                t.Cancel = "Cancelar";
                t.Close = "Cerrar";
                t.Finish = "Finalizar y Lanzar";
                t.Ready = "Listo para instalar.";
                t.Closing = "Cerrando procesos activos de VisionGuard...";
                t.Preparing = "Preparando el directorio de instalación...";
                t.Extracting = "Extrayendo archivos del paquete de software (puede tardar unos segundos)...";
                t.Shortcuts = "Creando accesos directos en el escritorio y menú de inicio...";
                t.Success = "¡Instalación completada con éxito!";
                t.Fail = "¡Instalación fallida!";
            }
            else if (lang == "ja")
            {
                t.Title = "VisionGuard セットアップ";
                t.Tagline = "Windows用のプレミアム20-20-20ルール休憩リマインダー";
                t.Description = "このウィザードは、VisionGuardをお使いのコンピューターにインストールします。目の健康のためのリマインダーとして、デスクトップおよびスタートメニューへのショートカットを作成します。";
                t.DestFolder = "インストール先フォルダ:";
                t.Browse = "参照...";
                t.Install = "インストール";
                t.Cancel = "キャンセル";
                t.Close = "閉じる";
                t.Finish = "完了して起動";
                t.Ready = "インストールの準備ができました。";
                t.Closing = "アクティブなVisionGuardプロセスを終了しています...";
                t.Preparing = "インストールディレクトリを準備しています...";
                t.Extracting = "ソフトウェアパッケージのファイルを展開しています（数秒かかります）...";
                t.Shortcuts = "デスクトップとスタートメニューのショートカットを作成しています...";
                t.Success = "インストールが正常に完了しました！";
                t.Fail = "インストールに失敗しました！";
            }
            else // "id"
            {
                t.Title = "Program Instalasi VisionGuard";
                t.Tagline = "Pengingat Aturan 20-20-20 Premium untuk Windows";
                t.Description = "Program ini akan memasang VisionGuard di komputer Anda, serta membuat pintasan di desktop dan start menu untuk pengingat kesehatan mata Anda.";
                t.DestFolder = "Folder Tujuan:";
                t.Browse = "Telusuri...";
                t.Install = "Instal";
                t.Cancel = "Batal";
                t.Close = "Tutup";
                t.Finish = "Selesai & Jalankan";
                t.Ready = "Siap dipasang.";
                t.Closing = "Menutup proses VisionGuard yang aktif...";
                t.Preparing = "Menyiapkan direktori instalasi...";
                t.Extracting = "Mengekstrak file paket aplikasi (memakan waktu beberapa detik)...";
                t.Shortcuts = "Membuat pintasan di Desktop dan Start Menu...";
                t.Success = "Instalasi selesai dengan sukses!";
                t.Fail = "Instalasi gagal!";
            }
        }

        private void InitializeComponent()
        {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            defaultInstallPath = Path.Combine(localAppData, "VisionGuard");

            // Form Settings
            this.Text = t.Title;
            this.Size = new Size(520, 370);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = true;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(7, 9, 14); // Sleek Obsidian dark
            this.ForeColor = Color.FromArgb(248, 250, 252); // Off-white text

            // Header Banner Panel
            pnlHeader = new Panel();
            pnlHeader.Size = new Size(520, 65);
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.BackColor = Color.FromArgb(15, 19, 29); // Deep Slate Navy
            this.Controls.Add(pnlHeader);

            // Header Banner Bottom Line Glow
            Panel pnlHeaderLine = new Panel();
            pnlHeaderLine.Size = new Size(520, 2);
            pnlHeaderLine.Location = new Point(0, 63);
            pnlHeaderLine.BackColor = Color.FromArgb(16, 185, 129); // Glowing Emerald border!
            pnlHeader.Controls.Add(pnlHeaderLine);

            // Title Label inside Header
            lblTitle = new Label();
            lblTitle.Text = t.Title;
            lblTitle.Font = new Font("Segoe UI", 14, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(16, 185, 129); // Emerald Green Accent
            lblTitle.Location = new Point(16, 12);
            lblTitle.Size = new Size(400, 25);
            pnlHeader.Controls.Add(lblTitle);

            // Tagline Label inside Header
            lblTagline = new Label();
            lblTagline.Text = t.Tagline;
            lblTagline.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblTagline.ForeColor = Color.FromArgb(100, 116, 139); // Muted Slate
            lblTagline.Location = new Point(17, 37);
            lblTagline.Size = new Size(400, 18);
            pnlHeader.Controls.Add(lblTagline);

            // Description Label
            lblDescription = new Label();
            lblDescription.Text = t.Description;
            lblDescription.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblDescription.ForeColor = Color.FromArgb(203, 213, 225); // Slate light
            lblDescription.Location = new Point(16, 85);
            lblDescription.Size = new Size(472, 50);
            this.Controls.Add(lblDescription);

            // Installation Folder Input Label
            lblFolder = new Label();
            lblFolder.Text = t.DestFolder;
            lblFolder.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblFolder.ForeColor = Color.FromArgb(248, 250, 252);
            lblFolder.Location = new Point(16, 150);
            lblFolder.Size = new Size(200, 18);
            this.Controls.Add(lblFolder);

            // Installation Folder Textbox
            txtFolder = new TextBox();
            txtFolder.Text = defaultInstallPath;
            txtFolder.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            txtFolder.BackColor = Color.FromArgb(15, 19, 29);
            txtFolder.ForeColor = Color.FromArgb(248, 250, 252);
            txtFolder.BorderStyle = BorderStyle.FixedSingle;
            txtFolder.Location = new Point(16, 172);
            txtFolder.Size = new Size(365, 23);
            this.Controls.Add(txtFolder);

            // Browse Folder Button
            btnBrowse = new Button();
            btnBrowse.Text = t.Browse;
            btnBrowse.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            btnBrowse.BackColor = Color.FromArgb(30, 41, 59);
            btnBrowse.ForeColor = Color.FromArgb(248, 250, 252);
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.FlatAppearance.BorderSize = 0;
            btnBrowse.Location = new Point(393, 171);
            btnBrowse.Size = new Size(95, 25);
            btnBrowse.Cursor = Cursors.Hand;
            btnBrowse.Click += BtnBrowse_Click;
            btnBrowse.MouseEnter += (s, e) => btnBrowse.BackColor = Color.FromArgb(51, 65, 85);
            btnBrowse.MouseLeave += (s, e) => btnBrowse.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(btnBrowse);

            // Progress Bar Panel
            prgBarPanel = new Panel();
            prgBarPanel.Location = new Point(16, 215);
            prgBarPanel.Size = new Size(472, 12); // Sleek modern thin line
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
                        using (Brush fillBrush = new SolidBrush(Color.FromArgb(16, 185, 129))) // Emerald Green
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
            lblStatus.Text = t.Ready;
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Italic);
            lblStatus.ForeColor = Color.FromArgb(16, 185, 129);
            lblStatus.Location = new Point(16, 245);
            lblStatus.Size = new Size(472, 20);
            this.Controls.Add(lblStatus);

            // Horizontal Line
            Panel pnlLine = new Panel();
            pnlLine.Size = new Size(520, 1);
            pnlLine.Location = new Point(0, 280);
            pnlLine.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(pnlLine);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = t.Install;
            btnInstall.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(16, 185, 129);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(285, 295);
            btnInstall.Size = new Size(100, 30);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += BtnInstall_Click;
            btnInstall.MouseEnter += (s, e) => { if(!isCompleted) btnInstall.BackColor = Color.FromArgb(52, 211, 153); };
            btnInstall.MouseLeave += (s, e) => { if(!isCompleted) btnInstall.BackColor = Color.FromArgb(16, 185, 129); };
            this.Controls.Add(btnInstall);

            // Cancel Button
            btnCancel = new Button();
            btnCancel.Text = t.Cancel;
            btnCancel.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            btnCancel.ForeColor = Color.FromArgb(248, 250, 252);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(393, 295);
            btnCancel.Size = new Size(95, 30);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += BtnCancel_Click;
            btnCancel.MouseEnter += (s, e) => btnCancel.BackColor = Color.FromArgb(51, 65, 85);
            btnCancel.MouseLeave += (s, e) => btnCancel.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(btnCancel);
        }

        private void BtnBrowse_Click(object sender, EventArgs e)
        {
            using (FolderBrowserDialog fbd = new FolderBrowserDialog())
            {
                fbd.Description = "Select target installation folder for VisionGuard:";
                fbd.SelectedPath = txtFolder.Text;
                if (fbd.ShowDialog() == DialogResult.OK)
                {
                    txtFolder.Text = fbd.SelectedPath;
                }
            }
        }

        private async void BtnInstall_Click(object sender, EventArgs e)
        {
            if (isCompleted)
            {
                string targetExe = Path.Combine(txtFolder.Text, "VisionGuard.exe");
                if (File.Exists(targetExe))
                {
                    Process.Start(targetExe);
                }
                Application.Exit();
                return;
            }

            string targetPath = txtFolder.Text.Trim();
            if (string.IsNullOrEmpty(targetPath))
            {
                MessageBox.Show("Please enter a valid installation directory path.", "Invalid Folder", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            txtFolder.Enabled = false;
            btnBrowse.Enabled = false;
            btnInstall.Enabled = false;
            btnCancel.Enabled = false;
            prgBarPanel.Visible = true;
            prgBarValue = 10;
            prgBarPanel.Invalidate();

            lblStatus.Text = "Initializing installation pipeline...";
            await Task.Delay(800);

            try
            {
                // 1. Terminate any running VisionGuard processes in background first
                lblStatus.Text = t.Closing;
                prgBarValue = 20;
                prgBarPanel.Invalidate();
                RunPowerShell("Stop-Process -Name VisionGuard -Force -ErrorAction SilentlyContinue");
                await Task.Delay(500);

                // 2. Clear out previous development/test data to start 100% cleanly in defaults!
                lblStatus.Text = "Configuring default application files...";
                prgBarValue = 30;
                prgBarPanel.Invalidate();
                string roamingPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "vision-guard");
                if (Directory.Exists(roamingPath))
                {
                    try { Directory.Delete(roamingPath, true); } catch {}
                }
                Directory.CreateDirectory(roamingPath);

                // Write fresh out-of-the-box configurations mapped to installer language
                string cleanSettingsContent = "{\n" +
                    string.Format("  \"language\": \"{0}\",\n", currentLang) +
                    "  \"interval\": 20,\n" +
                    "  \"duration\": 20,\n" +
                    "  \"strictMode\": false,\n" +
                    "  \"soundEnabled\": true,\n" +
                    "  \"autoStart\": true,\n" +
                    "  \"breakMode\": \"20-20-20\"\n" +
                    "}";
                
                string cleanStatsContent = "{\n" +
                    "  \"lastActiveDate\": \"\",\n" +
                    "  \"completedBreaks\": 0,\n" +
                    "  \"skippedBreaks\": 0,\n" +
                    "  \"screenTimeMinutes\": 0\n" +
                    "}";

                File.WriteAllText(Path.Combine(roamingPath, "settings.json"), cleanSettingsContent);
                File.WriteAllText(Path.Combine(roamingPath, "stats.json"), cleanStatsContent);
                await Task.Delay(400);

                // 3. Prepare target install directories
                lblStatus.Text = t.Preparing;
                prgBarValue = 45;
                prgBarPanel.Invalidate();
                if (Directory.Exists(targetPath))
                {
                    try
                    {
                        Directory.Delete(targetPath, true);
                    }
                    catch { /* ignore active locks */ }
                }
                Directory.CreateDirectory(targetPath);
                await Task.Delay(400);

                // 4. Extract Zip Archive embedded resource
                lblStatus.Text = t.Extracting;
                prgBarValue = 65;
                prgBarPanel.Invalidate();

                await Task.Run(() =>
                {
                    string tempZipPath = Path.Combine(Path.GetTempPath(), "visionguard_payload.zip");
                    
                    Assembly assembly = Assembly.GetExecutingAssembly();
                    using (Stream resStream = assembly.GetManifestResourceStream("app.zip"))
                    {
                        if (resStream == null)
                        {
                            throw new Exception("Payload resource stream is missing inside setup binary.");
                        }
                        using (FileStream fs = new FileStream(tempZipPath, FileMode.Create, FileAccess.Write))
                        {
                            resStream.CopyTo(fs);
                        }
                    }

                    ZipFile.ExtractToDirectory(tempZipPath, targetPath);
                    File.Delete(tempZipPath);
                });

                prgBarValue = 85;
                prgBarPanel.Invalidate();
                lblStatus.Text = t.Shortcuts;
                await Task.Delay(400);

                // 5. Configure Desktop and Start Menu Shortcuts
                string desktopFolder = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string startMenuFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");
                string targetExe = Path.Combine(targetPath, "VisionGuard.exe");

                string desktopShortCutScript = string.Format(
                    "$s=(New-Object -COM WScript.Shell).CreateShortcut('{0}');$s.TargetPath='{1}';$s.WorkingDirectory='{2}';$s.IconLocation='{1},0';$s.Save()",
                    Path.Combine(desktopFolder, "VisionGuard.lnk").Replace("'", "''"),
                    targetExe.Replace("'", "''"),
                    targetPath.Replace("'", "''")
                );

                string startMenuShortcutScript = string.Format(
                    "$s=(New-Object -COM WScript.Shell).CreateShortcut('{0}');$s.TargetPath='{1}';$s.WorkingDirectory='{2}';$s.IconLocation='{1},0';$s.Save()",
                    Path.Combine(startMenuFolder, "VisionGuard.lnk").Replace("'", "''"),
                    targetExe.Replace("'", "''"),
                    targetPath.Replace("'", "''")
                );
                
                RunPowerShell(desktopShortCutScript);
                RunPowerShell(startMenuShortcutScript);

                // 6. Register Uninstaller officially inside Windows Settings Add/Remove Programs (HKCU)
                string regKey = @"HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\VisionGuard";
                RunPowerShell("New-Item -Path '" + regKey + "' -Force -ErrorAction SilentlyContinue");
                RunPowerShell("Set-ItemProperty -Path '" + regKey + "' -Name 'DisplayName' -Value 'VisionGuard' -Type String");
                RunPowerShell("Set-ItemProperty -Path '" + regKey + "' -Name 'UninstallString' -Value '\"" + Path.Combine(targetPath, "Uninstall-VisionGuard.exe").Replace("'", "''") + "\"' -Type String");
                RunPowerShell("Set-ItemProperty -Path '" + regKey + "' -Name 'DisplayIcon' -Value '\"" + Path.Combine(targetPath, "VisionGuard.exe").Replace("'", "''") + "\"' -Type String");
                RunPowerShell("Set-ItemProperty -Path '" + regKey + "' -Name 'Publisher' -Value 'Antigravity & Rekhzzz' -Type String");
                RunPowerShell("Set-ItemProperty -Path '" + regKey + "' -Name 'DisplayVersion' -Value '1.0.0' -Type String");

                prgBarValue = 100;
                prgBarPanel.Invalidate();
                lblStatus.Text = t.Success;
                lblStatus.ForeColor = Color.FromArgb(16, 185, 129);
                await Task.Delay(500);

                isCompleted = true;
                btnInstall.Text = t.Finish;
                btnInstall.BackColor = Color.FromArgb(16, 185, 129);
                btnInstall.Enabled = true;
                
                btnCancel.Text = t.Close;
                btnCancel.Enabled = true;
            }
            catch (Exception ex)
            {
                prgBarValue = 0;
                prgBarPanel.Invalidate();
                lblStatus.Text = t.Fail;
                lblStatus.ForeColor = Color.FromArgb(244, 63, 94);
                txtFolder.Enabled = true;
                btnBrowse.Enabled = true;
                btnInstall.Enabled = true;
                btnCancel.Enabled = true;

                MessageBox.Show("An error occurred during installation:\n" + ex.Message, "Installation Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
    }
}
