import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  ArrowRight, Bell, CalendarDays, Clock, GraduationCap, LogIn,
  MapPin, Menu, Newspaper, Plus, Pencil, Trash2, X,
  LogOut, RefreshCw
} from "lucide-react";
import "./App.css";

const TABEL = {
  pengumuman: "pengumuman",
  berita: "berita",
  agenda: "agenda_akademik",
};

const LABEL = {
  pengumuman: "Pengumuman",
  berita: "Berita Kampus",
  agenda: "Agenda Akademik",
};

const FORM_KOSONG = {
  judul: "",
  isi: "",
  kategori: "Akademik",
  tanggal_pengumuman: "",
  gambar: null,
};

const AGENDA_DEFAULT = [
  {
    id: "contoh-krs",
    kategori: "Akademik",
    judul: "Periode Pengisian KRS",
    tanggal_pengumuman: null,
    isi: "Informasi periode pengisian Kartu Rencana Studi (KRS) akan ditampilkan di sini setelah admin memasukkan jadwal resmi. Mahasiswa dapat memeriksa pengumuman akademik dan menghubungi bagian akademik untuk memastikan periode pengisian.",
  },
  {
    id: "contoh-uts",
    kategori: "Akademik",
    judul: "Ujian Tengah Semester (UTS)",
    tanggal_pengumuman: null,
    isi: "Informasi jadwal dan ketentuan Ujian Tengah Semester (UTS) akan diperbarui oleh admin berdasarkan kalender akademik resmi universitas.",
  },
  {
    id: "contoh-uas",
    kategori: "Akademik",
    judul: "Ujian Akhir Semester (UAS)",
    tanggal_pengumuman: null,
    isi: "Informasi jadwal dan ketentuan Ujian Akhir Semester (UAS) akan diperbarui oleh admin berdasarkan kalender akademik resmi universitas.",
  },
];

const GAMBAR_DEFAULT = [
  {
    id: "contoh-berita-kampus",
    kategori: "Kampus",
    judul: "Mengenal Lebih Dekat Universitas Muhammadiyah Cirebon",
    gambar: "/images/kampus-1.jpg",
    isi: `Universitas Muhammadiyah Cirebon merupakan salah satu perguruan tinggi yang menjadi tempat bagi mahasiswa untuk memperoleh pendidikan, mengembangkan kemampuan, serta mempersiapkan diri menghadapi dunia kerja.

Melalui berbagai kegiatan akademik dan kemahasiswaan, mahasiswa memiliki kesempatan untuk meningkatkan pengetahuan, keterampilan, kreativitas, serta pengalaman selama menjalani masa perkuliahan.

Selain kegiatan pembelajaran di kelas, lingkungan kampus juga menjadi tempat untuk membangun relasi, bekerja sama, dan mengembangkan potensi melalui berbagai aktivitas positif.

Website ini hadir sebagai media informasi yang membantu mahasiswa mendapatkan informasi seputar lingkungan kampus, kegiatan akademik, jadwal perkuliahan, serta berbagai pengumuman penting.`,
  },
  {
    id: "contoh-berita-mahasiswa",
    kategori: "Mahasiswa",
    judul: "Ruang Berkembang dan Berkolaborasi bagi Mahasiswa",
    gambar: "/images/kampus-2.jpg",
    isi: `Masa perkuliahan bukan hanya tentang mengikuti kegiatan belajar mengajar, tetapi juga menjadi kesempatan bagi mahasiswa untuk mengembangkan kemampuan diri dan memperoleh pengalaman baru.

Mahasiswa dapat mengembangkan potensi melalui kegiatan organisasi, diskusi, kerja kelompok, seminar, serta berbagai aktivitas kemahasiswaan lainnya.

Melalui kolaborasi dan interaksi dengan sesama mahasiswa, kemampuan komunikasi, kepemimpinan, tanggung jawab, dan kerja sama dapat terus ditingkatkan.

Oleh karena itu, lingkungan kampus diharapkan menjadi ruang yang mendukung mahasiswa untuk terus belajar, berkarya, berinovasi, dan mempersiapkan masa depan.`,
  },
];

function tanggalIndo(value) {
  if (!value) return "Tanggal belum ditentukan";

  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function App() {
  const [halaman, setHalaman] = useState("beranda");
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [pengguna, setPengguna] = useState(null);
  const [profil, setProfil] = useState(null);
  const [memuatSesi, setMemuatSesi] = useState(true);

  const [jenisLogin, setJenisLogin] = useState("mahasiswa");
  const [modeDaftar, setModeDaftar] = useState(false);
  const [formAuth, setFormAuth] = useState({
    nama: "",
    nim: "",
    email: "",
    password: "",
  });
  const [pesanAuth, setPesanAuth] = useState("");
  const [sedangAuth, setSedangAuth] = useState(false);

  const [dataKonten, setDataKonten] = useState({
    pengumuman: [],
    berita: [],
    agenda: [],
  });

  const [statusMuat, setStatusMuat] = useState({
    pengumuman: true,
    berita: true,
    agenda: true,
  });

  const [errorMuat, setErrorMuat] = useState("");
  const [jenisKelola, setJenisKelola] = useState("pengumuman");
  const [formKonten, setFormKonten] = useState(FORM_KOSONG);
  const [idEdit, setIdEdit] = useState(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [itemDipilih, setItemDipilih] = useState(null);
  const [jenisDetail, setJenisDetail] = useState("pengumuman");
  const [gambarLama, setGambarLama] = useState("");

  const admin = profil?.role === "admin";

  // Memeriksa sesi login Supabase.
  useEffect(() => {
    let aktif = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && aktif) {
        await muatProfil(session.user);
      }

      if (aktif) {
        setMemuatSesi(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!aktif) return;

        if (session?.user) {
          setTimeout(() => {
            if (aktif) muatProfil(session.user);
          }, 0);
        } else {
          setPengguna(null);
          setProfil(null);
        }
      }
    );

    return () => {
      aktif = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Mengambil profil pengguna.
  async function muatProfil(user) {
    setPengguna(user);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,nama,nim,role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profil tidak dapat dimuat:", error.message);
      setProfil(null);
      return;
    }

    setProfil(data);
  }

  // Mengambil data dari tabel Supabase.
  async function ambilTabel(jenis) {
    setStatusMuat((s) => ({
      ...s,
      [jenis]: true,
    }));

    const { data, error } = await supabase
      .from(TABEL[jenis])
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        `Gagal memuat ${LABEL[jenis]}:`,
        error.message
      );

      setErrorMuat(
        `${LABEL[jenis]} belum dapat dimuat. Pastikan SQL setup sudah dijalankan di Supabase. Detail: ${error.message}`
      );
    } else {
      setDataKonten((s) => ({
        ...s,
        [jenis]: data || [],
      }));
    }

    setStatusMuat((s) => ({
      ...s,
      [jenis]: false,
    }));
  }

  async function muatSemuaKonten() {
    await Promise.all(
      Object.keys(TABEL).map(ambilTabel)
    );
  }

  useEffect(() => {
    muatSemuaKonten();
  }, []);
  // Mengelola tombol Back dan Forward Chrome.
useEffect(() => {
  // Tandai halaman pertama aplikasi.
  window.history.replaceState(
    {
      aplikasiUMC: true,
      halaman: "beranda",
      itemDipilih: null,
      jenisDetail: "pengumuman",
    },
    "",
    window.location.href
  );

  function tanganiPopState(event) {
    const state = event.state;

    if (state?.aplikasiUMC) {
      setHalaman(state.halaman || "beranda");
      setItemDipilih(state.itemDipilih || null);
      setJenisDetail(state.jenisDetail || "pengumuman");
    } else {
      setHalaman("beranda");
      setItemDipilih(null);
      setJenisDetail("pengumuman");
    }

    setMenuTerbuka(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  window.addEventListener("popstate", tanganiPopState);

  return () => {
    window.removeEventListener("popstate", tanganiPopState);
  };
}, []);

  function pindahHalaman(next, dataTambahan = {}) {
  if (next !== halaman || dataTambahan.itemDipilih) {
    window.history.pushState(
      {
        aplikasiUMC: true,
        halaman: next,
        itemDipilih:
          dataTambahan.itemDipilih ?? null,
        jenisDetail:
          dataTambahan.jenisDetail ?? jenisDetail,
      },
      "",
      window.location.href
    );
  }

  setHalaman(next);

  if (dataTambahan.itemDipilih) {
    setItemDipilih(dataTambahan.itemDipilih);
    setJenisDetail(dataTambahan.jenisDetail);
  }

  setMenuTerbuka(false);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

  // Proses login dan pendaftaran.
  async function prosesAuth(event) {
    event.preventDefault();
    setPesanAuth("");
    setSedangAuth(true);

    try {
      if (modeDaftar) {
        if (jenisLogin !== "mahasiswa") {
          throw new Error(
            "Pendaftaran mandiri hanya tersedia untuk mahasiswa. Akun admin dibuat melalui Supabase."
          );
        }

        if (
          !formAuth.nama.trim() ||
          !formAuth.nim.trim()
        ) {
          throw new Error(
            "Nama lengkap dan NIM wajib diisi."
          );
        }

        if (formAuth.password.length < 8) {
          throw new Error(
            "Password minimal 8 karakter."
          );
        }

        const { data, error } =
          await supabase.auth.signUp({
            email: formAuth.email.trim(),
            password: formAuth.password,
            options: {
              data: {
                nama: formAuth.nama.trim(),
                nim: formAuth.nim.trim(),
              },
            },
          });

        if (error) throw error;

        if (data.session) {
          await muatProfil(data.user);
          pindahHalaman("beranda");

          setPesanAuth(
            "Pendaftaran berhasil. Selamat datang di UMC Update."
          );
        } else {
          setPesanAuth(
            "Pendaftaran berhasil dikirim. Silakan buka email untuk verifikasi akun, lalu masuk."
          );

          setModeDaftar(false);
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: formAuth.email.trim(),
            password: formAuth.password,
          });

        if (error) throw error;

        const { data: p, error: profileError } =
          await supabase
            .from("profiles")
            .select("id,nama,nim,role")
            .eq("id", data.user.id)
            .single();

        if (profileError) {
          throw new Error(
            "Profil akun tidak ditemukan. Jalankan SQL setup Supabase terlebih dahulu."
          );
        }

        if (
          jenisLogin === "admin" &&
          p.role !== "admin"
        ) {
          await supabase.auth.signOut();

          throw new Error(
            "Akun ini bukan administrator. Pilih Mahasiswa atau gunakan akun admin resmi."
          );
        }

        if (
          jenisLogin === "mahasiswa" &&
          p.role !== "mahasiswa"
        ) {
          await supabase.auth.signOut();

          throw new Error(
            "Akun ini bukan akun mahasiswa."
          );
        }

        setPengguna(data.user);
        setProfil(p);

        pindahHalaman(
          p.role === "admin" ? "admin" : "beranda"
        );
      }
    } catch (error) {
      setPesanAuth(
        error.message ||
          "Terjadi kesalahan saat memproses akun."
      );
    } finally {
      setSedangAuth(false);
    }
  }

  // Keluar dari akun.
  async function keluar() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setPesanAuth(error.message);
    }

    setPengguna(null);
    setProfil(null);

    setFormAuth({
      nama: "",
      nim: "",
      email: "",
      password: "",
    });

    pindahHalaman("beranda");
  }

  function bukaDetail(item, jenis) {
  pindahHalaman("detail", {
    itemDipilih: item,
    jenisDetail: jenis,
  });
}

  function resetForm() {
    setIdEdit(null);
    setGambarLama("");
    setFormKonten(FORM_KOSONG);
  }

  function mulaiEdit(item) {
    setIdEdit(item.id);
    setGambarLama(item.gambar_url || "");

    setFormKonten({
      judul: item.judul || "",
      isi: item.isi || "",
      kategori: item.kategori || "Akademik",
      tanggal_pengumuman:
        item.tanggal_pengumuman || "",
      gambar: null,
    });

    document
      .getElementById("form-konten")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // Menambah dan memperbarui konten.
  async function simpanKonten(event) {
    event.preventDefault();

    if (!admin) return;

    setSedangSimpan(true);

    let gambarUrl = gambarLama || null;
    let pathGambar = null;

    try {
      if (formKonten.gambar) {
        const file = formKonten.gambar;

        if (!file.type.startsWith("image/")) {
          throw new Error(
            "File harus berupa gambar."
          );
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(
            "Ukuran gambar maksimal 5 MB."
          );
        }

        const ekstensi =
          file.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        pathGambar = `${jenisKelola}/${crypto.randomUUID()}.${ekstensi}`;

        const { error: uploadError } =
          await supabase.storage
            .from("gambar-kampus")
            .upload(pathGambar, file, {
              upsert: false,
              contentType: file.type,
            });

        if (uploadError) throw uploadError;

        const { data: publicData } =
          supabase.storage
            .from("gambar-kampus")
            .getPublicUrl(pathGambar);

        gambarUrl = publicData.publicUrl;
      }

      const payload = {
        judul: formKonten.judul.trim(),
        isi: formKonten.isi.trim(),
        kategori: formKonten.kategori,
        tanggal_pengumuman:
          formKonten.tanggal_pengumuman || null,
        gambar_url: gambarUrl,
      };

      const query = supabase.from(TABEL[jenisKelola]);

      const result = idEdit
        ? await query.update(payload).eq("id", idEdit)
        : await query.insert(payload);

      if (result.error) throw result.error;

      if (
        idEdit &&
        gambarLama &&
        formKonten.gambar
      ) {
        const oldPath =
          gambarLama.split("/gambar-kampus/")[1];

        if (oldPath) {
          await supabase.storage
            .from("gambar-kampus")
            .remove([decodeURIComponent(oldPath)]);
        }
      }

      const sedangEdit = Boolean(idEdit);

      resetForm();
      await ambilTabel(jenisKelola);

      alert(
        `${LABEL[jenisKelola]} berhasil ${
          sedangEdit ? "diperbarui" : "ditambahkan"
        }.`
      );
    } catch (error) {
      if (pathGambar) {
        await supabase.storage
          .from("gambar-kampus")
          .remove([pathGambar]);
      }

      alert(`Gagal menyimpan: ${error.message}`);
    } finally {
      setSedangSimpan(false);
    }
  }

  // Menghapus konten.
  async function hapusKonten(item, jenis) {
    if (
      !admin ||
      !window.confirm(
        `Hapus ${LABEL[jenis].toLowerCase()} “${item.judul}”?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from(TABEL[jenis])
      .delete()
      .eq("id", item.id);

    if (error) {
      alert(`Gagal menghapus: ${error.message}`);
      return;
    }

    if (item.gambar_url) {
      const path =
        item.gambar_url.split("/gambar-kampus/")[1];

      if (path) {
        await supabase.storage
          .from("gambar-kampus")
          .remove([decodeURIComponent(path)]);
      }
    }

    await ambilTabel(jenis);

    if (idEdit === item.id) {
      resetForm();
    }
  }

  // Tampilan kartu konten.
  function kartuKonten(item, jenis, ringkas = false) {
    const gambar = item.gambar_url || item.gambar;

    return (
      <article
        className={`announcement-card ${
          gambar ? "has-image" : ""
        }`}
        key={item.id}
      >
        {gambar && (
          <img
            className="content-thumb"
            src={gambar}
            alt={`Gambar ${item.judul}`}
          />
        )}

        <span className="tag">
          {item.kategori || LABEL[jenis]}
        </span>

        <small>
          <Clock size={13} />
          {tanggalIndo(item.tanggal_pengumuman)}
        </small>

        <h3>{item.judul}</h3>

        <p style={{ whiteSpace: "pre-line" }}>
          {ringkas && item.isi.length > 150
            ? `${item.isi.slice(0, 150)}…`
            : item.isi}
        </p>

        <button
          type="button"
          className="card-link"
          onClick={() => bukaDetail(item, jenis)}
        >
          Baca selengkapnya
          <ArrowRight size={15} />
        </button>

        {admin && halaman === "admin" && (
          <div className="admin-actions">
            <button
              type="button"
              onClick={() => {
                setJenisKelola(jenis);
                mulaiEdit(item);
              }}
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => hapusKonten(item, jenis)}
            >
              <Trash2 size={15} />
              Hapus
            </button>
          </div>
        )}
      </article>
    );
  }

  function statusKonten(jenis) {
    if (statusMuat[jenis]) {
      return (
        <p role="status" className="page-intro">
          Memuat {LABEL[jenis].toLowerCase()}…
        </p>
      );
    }

    if (dataKonten[jenis].length === 0) {
      return (
        <p className="page-intro">
          Belum ada {LABEL[jenis].toLowerCase()} yang ditambahkan.
        </p>
      );
    }

    return null;
  }

  // Navigasi utama.
  function navbar() {
    return (
      <header className="navbar">
        <button
          type="button"
          className="brand brand-button"
          onClick={() => pindahHalaman("beranda")}
        >
          <img
            className="brand-image"
            src="/images/logo-umc.png"
            alt="Logo Universitas Muhammadiyah Cirebon"
          />

          <span>
            <strong>
              UMC <span>UPDATE</span>
            </strong>
            <small>Informasi Kampus Terpercaya</small>
          </span>
        </button>

        <button
          type="button"
          className="menu-toggle"
          aria-label={
            menuTerbuka ? "Tutup menu" : "Buka menu"
          }
          aria-expanded={menuTerbuka}
          onClick={() => setMenuTerbuka(!menuTerbuka)}
        >
          {menuTerbuka ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

        <nav
          className={`nav-links ${
            menuTerbuka ? "open" : ""
          }`}
          aria-label="Navigasi utama"
        >
          <button
            type="button"
            onClick={() => pindahHalaman("beranda")}
          >
            Beranda
          </button>

          <button
            type="button"
            onClick={() => pindahHalaman("pengumuman")}
          >
            Pengumuman
          </button>

          <button
            type="button"
            onClick={() => pindahHalaman("berita")}
          >
            Berita Kampus
          </button>

          <button
            type="button"
            onClick={() => pindahHalaman("agenda")}
          >
            Agenda Akademik
          </button>

          {pengguna ? (
            <>
              {admin && (
                <button
                  type="button"
                  className="login-button"
                  onClick={() => pindahHalaman("admin")}
                >
                  Dashboard Admin
                </button>
              )}

              <button
                type="button"
                className="login-button"
                onClick={keluar}
              >
                <LogOut size={16} />
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="login-button"
              onClick={() => {
                setModeDaftar(false);
                pindahHalaman("login");
              }}
            >
              Masuk / Daftar
              <ArrowRight size={17} />
            </button>
          )}
        </nav>
      </header>
    );
  }

  // Halaman beranda.
  function halamanBeranda() {
    return (
      <>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow red">
              KABAR TERBARU · KAMPUS KITA
            </span>

            <h1>
              Selamat Datang di{" "}
              <span>
                Universitas Muhammadiyah Cirebon
              </span>
            </h1>

            {profil && (
              <p className="welcome-user">
                Halo, {profil.nama || pengguna?.email}! 👋
              </p>
            )}

            <p>
              Temukan pengumuman, berita, dan informasi
              akademik terbaru dalam satu tempat.
            </p>

            <button
              type="button"
              className="hero-button"
              onClick={() => pindahHalaman("pengumuman")}
            >
              Lihat Pengumuman
              <ArrowRight size={18} />
            </button>

            <div className="hero-meta">
              <span>
                <MapPin size={17} />
                Cirebon, Jawa Barat
              </span>

              <span>
                <GraduationCap size={20} />
                Universitas Muhammadiyah Cirebon
              </span>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="/images/gedung-umc.jpg"
              alt="Gedung Universitas Muhammadiyah Cirebon"
            />
            <div className="image-caption">
              Kampus Universitas Muhammadiyah Cirebon
            </div>
          </div>
        </section>

        <section className="quick-info">
          <button
            type="button"
            onClick={() => pindahHalaman("pengumuman")}
          >
            <span className="info-icon">
              <Bell size={26} />
            </span>
            <span>
              <strong>Pengumuman</strong>
              <p>Informasi penting kampus</p>
            </span>
          </button>

          <button
            type="button"
            onClick={() => pindahHalaman("berita")}
          >
            <span className="info-icon">
              <Newspaper size={26} />
            </span>
            <span>
              <strong>Berita Kampus</strong>
              <p>Kabar dan cerita terbaru</p>
            </span>
          </button>

          <button
            type="button"
            onClick={() => pindahHalaman("agenda")}
          >
            <span className="info-icon">
              <CalendarDays size={26} />
            </span>
            <span>
              <strong>Agenda Akademik</strong>
              <p>Pengingat jadwal akademik</p>
            </span>
          </button>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">
                JANGAN TERLEWAT
              </span>
              <h2>Pengumuman Terbaru</h2>
            </div>

            <button
              type="button"
              className="text-link"
              onClick={() => pindahHalaman("pengumuman")}
            >
              Lihat semua
              <ArrowRight size={17} />
            </button>
          </div>

          {statusKonten("pengumuman") || (
            <div className="announcement-grid">
              {dataKonten.pengumuman
                .slice(0, 3)
                .map((item) =>
                  kartuKonten(item, "pengumuman", true)
                )}
            </div>
          )}
        </section>

        <section className="content-section news-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">
                CERITA KAMPUS
              </span>
              <h2>Berita Kampus</h2>
            </div>

            <button
              type="button"
              className="text-link"
              onClick={() => pindahHalaman("berita")}
            >
              Lihat semua
              <ArrowRight size={17} />
            </button>
          </div>

          {statusMuat.berita ? (
            <p role="status" className="page-intro">
              Memuat berita kampus…
            </p>
          ) : (
            <div className="news-grid">
              {(
                dataKonten.berita.length
                  ? dataKonten.berita
                  : GAMBAR_DEFAULT
              )
                .slice(0, 2)
                .map((item, index) => (
                  <article
                    className="news-card"
                    key={item.id || index}
                  >
                    <img
                      src={item.gambar_url || item.gambar}
                      alt={item.judul}
                    />

                    <div className="news-body">
                      <span className="tag">
                        {item.kategori}
                      </span>

                      <h3>{item.judul}</h3>

                      <p style={{ whiteSpace: "pre-line" }}>
                        {item.isi}
                      </p>

                      <button
                        type="button"
                        className="card-link"
                        onClick={() =>
                          bukaDetail(item, "berita")
                        }
                      >
                        Selengkapnya
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">
                CATAT TANGGALNYA
              </span>
              <h2>Agenda Akademik</h2>
            </div>

            <button
              type="button"
              className="text-link"
              onClick={() => pindahHalaman("agenda")}
            >
              Lihat agenda
              <ArrowRight size={17} />
            </button>
          </div>

          {statusMuat.agenda ? (
            <p role="status" className="page-intro">
              Memuat agenda akademik…
            </p>
          ) : (
            <div className="announcement-grid">
              {(
                dataKonten.agenda.length
                  ? dataKonten.agenda
                  : AGENDA_DEFAULT
              )
                .slice(0, 3)
                .map((item) =>
                  kartuKonten(item, "agenda", true)
                )}
            </div>
          )}
        </section>
      </>
    );
  }

  // Halaman daftar pengumuman, berita, dan agenda.
  function halamanDaftar(jenis) {
    const daftar =
      dataKonten[jenis].length
        ? dataKonten[jenis]
        : jenis === "agenda"
          ? AGENDA_DEFAULT
          : jenis === "berita"
            ? GAMBAR_DEFAULT
            : [];

    return (
      <main className="content-section page-content">
        <span className="eyebrow red">
          INFORMASI RESMI KAMPUS
        </span>

        <h1>{LABEL[jenis]}</h1>

        <p className="page-intro">
          {jenis === "agenda"
            ? "Jadwal akademik dan informasi penting seputar KRS, UTS, UAS, serta kegiatan perkuliahan."
            : "Informasi dan kabar terbaru seputar Universitas Muhammadiyah Cirebon."}
        </p>

        {statusMuat[jenis] ? (
          <p role="status" className="page-intro">
            Memuat {LABEL[jenis].toLowerCase()}…
          </p>
        ) : (
          <div
            className={
              jenis === "berita"
                ? "news-grid"
                : "announcement-grid"
            }
          >
            {daftar.map((item) =>
              kartuKonten(item, jenis)
            )}
          </div>
        )}

        {admin && (
          <button
            type="button"
            className="hero-button"
            onClick={() => {
              setJenisKelola(jenis);
              resetForm();
              pindahHalaman("admin");
            }}
          >
            <Plus size={17} />
            Tambah {LABEL[jenis]}
          </button>
        )}
      </main>
    );
  }

  // Halaman login.
  function halamanLogin() {
    return (
      <main className="login-layout">
        <section className="login-photo">
          <div className="photo-overlay">
            <h1>
              Informasi Kampus, Semua dalam Satu Tempat.
            </h1>
            <p>
              Tetap terhubung dengan pengumuman, agenda
              akademik, dan kabar terbaru dari kampusmu.
            </p>
          </div>
        </section>

        <form
          className="login-form"
          onSubmit={prosesAuth}
        >
          <img
            className="login-logo"
            src="/images/logo-umc.png"
            alt="Logo Universitas Muhammadiyah Cirebon"
          />

          <span className="eyebrow red">
            SELAMAT DATANG
          </span>

          <h2>
            {modeDaftar
              ? "Daftar Akun Mahasiswa"
              : jenisLogin === "admin"
                ? "Login Administrator"
                : "Halo, Mahasiswa UMC! 👋"}
          </h2>

          <p>
            Masuk untuk mengakses layanan informasi kampus.
          </p>

          <label htmlFor="jenis-login">
            Masuk sebagai
          </label>

          <select
            id="jenis-login"
            value={jenisLogin}
            onChange={(e) => {
              setJenisLogin(e.target.value);
              setModeDaftar(false);
              setPesanAuth("");
            }}
          >
            <option value="mahasiswa">Mahasiswa</option>
            <option value="admin">Administrator</option>
          </select>

          {modeDaftar && (
            <>
              <label htmlFor="nama">Nama lengkap</label>
              <input
                id="nama"
                value={formAuth.nama}
                onChange={(e) =>
                  setFormAuth({
                    ...formAuth,
                    nama: e.target.value,
                  })
                }
                required
                autoComplete="name"
              />

              <label htmlFor="nim">NIM</label>
              <input
                id="nim"
                value={formAuth.nim}
                onChange={(e) =>
                  setFormAuth({
                    ...formAuth,
                    nim: e.target.value,
                  })
                }
                required
              />
            </>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formAuth.email}
            onChange={(e) =>
              setFormAuth({
                ...formAuth,
                email: e.target.value,
              })
            }
            required
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={formAuth.password}
            onChange={(e) =>
              setFormAuth({
                ...formAuth,
                password: e.target.value,
              })
            }
            required
            minLength={8}
            autoComplete={
              modeDaftar
                ? "new-password"
                : "current-password"
            }
          />

          {pesanAuth && (
            <p role="alert" className="form-message">
              {pesanAuth}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={sedangAuth}
          >
            <LogIn size={18} />
            {sedangAuth
              ? "Memproses…"
              : modeDaftar
                ? "Daftar Sekarang"
                : "Masuk ke UMC Update"}
          </button>

          {jenisLogin === "mahasiswa" && (
            <button
              type="button"
              className="back-link"
              onClick={() => {
                setModeDaftar(!modeDaftar);
                setPesanAuth("");
              }}
            >
              {modeDaftar
                ? "Sudah punya akun? Masuk"
                : "Belum punya akun? Daftar mahasiswa"}
            </button>
          )}

          {jenisLogin === "admin" && (
            <small className="login-note">
              Akun administrator dibuat atau diberi hak admin
              melalui Supabase oleh pengelola sistem.
              Pendaftaran admin terbuka tidak disediakan
              demi keamanan.
            </small>
          )}

          <button
            type="button"
            className="back-link"
            onClick={() => pindahHalaman("beranda")}
          >
            ← Kembali ke beranda
          </button>
        </form>
      </main>
    );
  }

  // Dashboard administrator.
  function halamanAdmin() {
    if (!admin) {
      return (
        <main className="content-section page-content">
          <h1>Akses ditolak</h1>

          <p className="page-intro">
            Halaman ini hanya dapat dibuka oleh administrator.
          </p>

          <button
            className="hero-button"
            onClick={() => pindahHalaman("login")}
          >
            Masuk sebagai admin
          </button>
        </main>
      );
    }

    return (
      <main className="content-section page-content admin-page">
        <span className="eyebrow red">
          PENGELOLAAN KONTEN
        </span>

        <h1>Dashboard Administrator</h1>

        <p className="page-intro">
          Kelola pengumuman, berita kampus, dan agenda
          akademik. Kamu dapat menambahkan gambar pada
          setiap informasi.
        </p>

        <div
          className="admin-tabs"
          role="group"
          aria-label="Jenis konten yang dikelola"
        >
          {Object.keys(TABEL).map((jenis) => (
            <button
              type="button"
              className={
                jenisKelola === jenis ? "active" : ""
              }
              key={jenis}
              onClick={() => {
                setJenisKelola(jenis);
                resetForm();
              }}
            >
              {LABEL[jenis]}
            </button>
          ))}
        </div>

        <section
          className="announcement-card admin-form-card"
          id="form-konten"
        >
          <h2>
            {idEdit
              ? `Edit ${LABEL[jenisKelola]}`
              : `Tambah ${LABEL[jenisKelola]}`}
          </h2>

          <form
            onSubmit={simpanKonten}
            className="content-form"
          >
            <label htmlFor="judul-konten">Judul</label>
            <input
              id="judul-konten"
              value={formKonten.judul}
              onChange={(e) =>
                setFormKonten({
                  ...formKonten,
                  judul: e.target.value,
                })
              }
              required
              maxLength={180}
            />

            <label htmlFor="kategori-konten">
              Kategori
            </label>

            <select
              id="kategori-konten"
              value={formKonten.kategori}
              onChange={(e) =>
                setFormKonten({
                  ...formKonten,
                  kategori: e.target.value,
                })
              }
            >
              <option>Akademik</option>
              <option>Kampus</option>
              <option>Mahasiswa</option>
              <option>Kegiatan</option>
              <option>Informasi</option>
            </select>

            <label htmlFor="tanggal-konten">
              Tanggal informasi / agenda
            </label>

            <input
              id="tanggal-konten"
              type="date"
              value={formKonten.tanggal_pengumuman}
              onChange={(e) =>
                setFormKonten({
                  ...formKonten,
                  tanggal_pengumuman: e.target.value,
                })
              }
            />

            <label htmlFor="isi-konten">
              Isi informasi
            </label>

            <textarea
              id="isi-konten"
              rows={6}
              value={formKonten.isi}
              onChange={(e) =>
                setFormKonten({
                  ...formKonten,
                  isi: e.target.value,
                })
              }
              required
            />

            <label htmlFor="gambar-konten">
              Gambar (JPG, PNG, WEBP; maksimal 5 MB)
            </label>

            <input
              id="gambar-konten"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setFormKonten({
                  ...formKonten,
                  gambar: e.target.files?.[0] || null,
                })
              }
            />

            {gambarLama && !formKonten.gambar && (
              <div className="image-preview">
                <img
                  src={gambarLama}
                  alt="Gambar yang sedang digunakan"
                />
                <span>
                  Gambar saat ini. Pilih file baru jika
                  ingin mengganti.
                </span>
              </div>
            )}

            {formKonten.gambar && (
              <p className="page-intro">
                File dipilih: {formKonten.gambar.name}
              </p>
            )}

            <div className="form-buttons">
              <button
                type="submit"
                className="login-submit"
                disabled={sedangSimpan}
              >
                {sedangSimpan
                  ? "Menyimpan…"
                  : idEdit
                    ? "Simpan Perubahan"
                    : (
                      <>
                        <Plus size={16} />
                        Tambahkan Informasi
                      </>
                    )}
              </button>

              {idEdit && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <div className="section-heading admin-list-heading">
          <h2>Daftar {LABEL[jenisKelola]}</h2>

          <button
            type="button"
            className="text-link"
            onClick={() => ambilTabel(jenisKelola)}
          >
            <RefreshCw size={15} />
            Muat ulang
          </button>
        </div>

        {statusKonten(jenisKelola) || (
          <div className="announcement-grid">
            {dataKonten[jenisKelola].map((item) =>
              kartuKonten(item, jenisKelola)
            )}
          </div>
        )}
      </main>
    );
  }

  // Halaman detail konten.
  function halamanDetail() {
    if (!itemDipilih) {
      return halamanDaftar("pengumuman");
    }

    return (
      <main className="content-section page-content">
        <span className="eyebrow red">
          {LABEL[jenisDetail].toUpperCase()}
        </span>

        <article className="detail-card">
          {(itemDipilih.gambar_url || itemDipilih.gambar) && (
            <img
              className="detail-image"
              src={
                itemDipilih.gambar_url ||
                itemDipilih.gambar
              }
              alt={`Gambar ${itemDipilih.judul}`}
            />
          )}

          <span className="tag">
            {itemDipilih.kategori}
          </span>

          <small>
            <Clock size={14} />
            {tanggalIndo(itemDipilih.tanggal_pengumuman)}
          </small>

          <h1>{itemDipilih.judul}</h1>

          <p style={{ whiteSpace: "pre-line" }}>
            {itemDipilih.isi}
          </p>

          <button
            type="button"
            className="back-link"
            onClick={() => window.history.back()}
          >
            ← Kembali ke {LABEL[jenisDetail]}
          </button>
        </article>
      </main>
    );
  }

  // Menentukan halaman yang ditampilkan.
  function kontenHalaman() {
    if (memuatSesi && halaman === "admin") {
      return (
        <main className="content-section">
          <p role="status">Memeriksa sesi…</p>
        </main>
      );
    }

    switch (halaman) {
      case "pengumuman":
        return halamanDaftar("pengumuman");

      case "berita":
        return halamanDaftar("berita");

      case "agenda":
        return halamanDaftar("agenda");

      case "login":
        return halamanLogin();

      case "admin":
        return halamanAdmin();

      case "detail":
        return halamanDetail();

      default:
        return halamanBeranda();
    }
  }

  return (
    <>
      {navbar()}

      {errorMuat && (
        <div className="global-error" role="alert">
          {errorMuat}
        </div>
      )}

      {kontenHalaman()}

      <footer className="footer">
        <img
          className="brand-image"
          src="/images/logo-umc.png"
          alt="Logo UMC"
        />

        <div>
          <strong>UMC UPDATE</strong>
          <p>Informasi kampus dalam satu tempat.</p>
        </div>

        <small>
          © 2026 UMC UPDATE
          <br />
          Proyek demonstrasi mahasiswa
        </small>
      </footer>
    </>
  );
}

export default App;