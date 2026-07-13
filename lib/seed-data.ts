import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const now = () => new Date();
const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/**
 * Idempotent initial data seed: admin user, site settings, content pages
 * and 3 sample auctions. Used by `npm run db:seed` and /api/setup.
 */
export async function runSeed(db: PrismaClient): Promise<string[]> {
  const log: string[] = [];

  /* 1. Admin user: gertmaeste / KAStead22! */
  const passwordHash = await bcrypt.hash("KAStead22!", 12);
  await db.user.upsert({
    where: { email: "gertmaeste@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      email: "gertmaeste@gmail.com",
      name: "gertmaeste",
      role: "ADMIN",
      emailVerified: now(),
      passwordHash,
    },
  });
  log.push("Admin user (gertmaeste@gmail.com)");

  /* 2. Site settings */
  const settings: Record<string, string> = {
    min_bid_increment: "50",
    contact_phone_info: "+372 5647 2277",
    contact_phone_tow: "+372 5666 8822",
    contact_email: "romu@romu.ee",
    business_name: "AMJ Autoäri OÜ",
    business_reg: "10615599",
    business_address: "Üksnurme tee 14, Saku 75501",
    business_hours: "E–R 9–17, L–P suletud",
    logo_url: "",
    partner_bta_url: "",
    partner_gjensidige_url: "",
    partner_seesam_url: "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSettings.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  log.push("Site settings");

  /* 3. Content pages (Estonian sample content) */
  const pages: Record<string, string> = {
    reeglid: `<h2>Oksjoni reeglid</h2>
<p>Oksjonil osalemiseks peab kasutaja olema vähemalt 18-aastane ning kinnitanud oma e-posti aadressi.</p>
<h3>Pakkumiste tegemine</h3>
<p>Iga pakkumine on siduv. Minimaalne pakkumise samm on 50 €. Pakkumist ei saa tagasi võtta.</p>
<h3>Telefonioksjon</h3>
<p>Pärast online-oksjoni lõppu võib toimuda telefonioksjon, mille käigus võetakse parimate pakkujatega telefoni teel ühendust.</p>
<h3>Tasumine ja üleandmine</h3>
<p>Võitja tasub ostuhinna 3 tööpäeva jooksul. Sõiduk antakse üle pärast täieliku makse laekumist.</p>
<h3>Vastutus</h3>
<p>Sõidukid müüakse seisukorras "nagu on". Ostjal on soovitatav sõidukiga enne pakkumise tegemist kohapeal tutvuda.</p>`,
    kkk: `<h3>Kuidas saan oksjonil osaleda?</h3>
<p>Registreeri konto, kinnita oma e-posti aadress ning saad teha pakkumisi kõikidel aktiivsetel oksjonitel.</p>
<h3>Kas pakkumine on siduv?</h3>
<p>Jah, iga tehtud pakkumine on siduv ning seda ei saa tagasi võtta.</p>
<h3>Mis on telefonioksjon?</h3>
<p>Pärast online-oksjoni lõppu võib müüja jätkata oksjonit telefoni teel parimate pakkujatega. Sellisel juhul kuvatakse oksjonil märge "Käimas on telefonioksjon".</p>
<h3>Kas sõidukeid saab enne ostmist vaadata?</h3>
<p>Jah, sõidukitega saab tutvuda meie platsil Sakus tööaegadel E–R 9–17. Soovitame aja eelnevalt kokku leppida.</p>
<h3>Kuidas toimub tasumine?</h3>
<p>Võitjaga võetakse ühendust ning arve tuleb tasuda pangaülekandega 3 tööpäeva jooksul.</p>
<h3>Kas hindadele lisandub käibemaks?</h3>
<p>Käibemaksu määr on märgitud iga oksjoni andmete tabelis. Enamik sõidukeid müüakse 0% käibemaksuga.</p>`,
    privaatsuspoliitika: `<h2>Privaatsuspoliitika</h2>
<p>Käesolev privaatsuspoliitika kirjeldab, kuidas AMJ Autoäri OÜ (reg nr 10615599) töötleb kasutajate isikuandmeid.</p>
<h3>Kogutavad andmed</h3>
<p>Kogume järgmisi andmeid: nimi, e-posti aadress, telefoninumber, ettevõtte nimi ning pakkumiste ajalugu.</p>
<h3>Andmete kasutamine</h3>
<p>Andmeid kasutatakse oksjonite läbiviimiseks, võitjatega ühenduse võtmiseks ning seadusest tulenevate kohustuste täitmiseks.</p>
<h3>Andmete jagamine</h3>
<p>Pakkujate nimed kuvatakse avalikult ainult initsiaalidena. Andmeid ei jagata kolmandate osapooltega, välja arvatud seaduses sätestatud juhtudel.</p>
<h3>Teie õigused</h3>
<p>Teil on õigus tutvuda oma andmetega, nõuda nende parandamist või kustutamist, kirjutades aadressile romu@romu.ee.</p>`,
    teenused: `<h2>Teenused</h2>
<h3>Kindlustusjuhtumitega sõidukite oksjonid</h3>
<p>Korraldame kindlustusseltside poolt müüdavate avariiliste sõidukite oksjoneid. Kõik sõidukid on meie platsil ülevaatamiseks saadaval.</p>
<h3>Puksiiriteenus 24h</h3>
<p>Pakume ööpäevaringset puksiiriteenust. Helista +372 5666 8822.</p>
<h3>Sõidukite kokkuost</h3>
<p>Ostame kokku avariilisi ja seisvaid sõidukeid. Küsi pakkumist romu@romu.ee.</p>
<h3>Varuosade müük</h3>
<p>Müüme kasutatud originaalvaruosi. Vaata varuosade oksjoneid või küsi otse.</p>`,
  };
  for (const [slug, et] of Object.entries(pages)) {
    await db.page.upsert({
      where: { slug },
      update: {},
      create: { slug, content: { et } },
    });
  }
  log.push("Content pages");

  /* 4. Sample auctions (3 active) */
  const sampleAuctions = [
    {
      slug: "audi-a4-cabriolet-2-5-tdi",
      title: {
        et: "Audi A4 Cabriolet 2.5 TDI",
        en: "Audi A4 Cabriolet 2.5 TDI",
        ru: "Audi A4 Cabriolet 2.5 TDI",
      },
      description: {
        et: "<p>Kindlustusjuhtumiga sõiduk. Kahjustused esiosas: kapott, stange ja parem tiib. Mootor käivitub ja töötab. Sõiduk asub meie platsil Sakus.</p>",
        en: "<p>Insurance case vehicle. Front-end damage: hood, bumper and right fender. Engine starts and runs. Located at our yard in Saku.</p>",
      },
      make: "Audi",
      model: "A4 Cabriolet",
      year: 2005,
      firstRegDate: "2005/03",
      regNumber: "123 ABC",
      vinCode: "WAUZZZ8H15K000000",
      fuelType: "Diisel",
      engineVolume: 2.5,
      enginePower: 120,
      gearbox: "Manuaal",
      drivenAxle: "Esivedu",
      odometer: 438723,
      climateControl: "Kliimaautomaatik",
      seats: 4,
      color: "Hall",
      condition: "Kasutatud, avariiline",
      vatPercent: 0,
      customAttributes: [
        { key: "Kahjustused", value: "Esiosa: kapott, stange, parem tiib" },
        { key: "Võtmed", value: "2 tk" },
      ],
      startingPrice: 500,
      reservePrice: 1500,
      auctionEnd: days(3),
      phoneAuctionActive: true,
      image:
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80",
    },
    {
      slug: "bmw-320d-touring",
      title: {
        et: "BMW 320d Touring",
        en: "BMW 320d Touring",
        ru: "BMW 320d Touring",
      },
      description: {
        et: "<p>Kindlustusjuhtumiga universaal. Küljekahjustus vasakul, turvapadjad avanemata. Sõidukorras.</p>",
      },
      make: "BMW",
      model: "320d Touring",
      year: 2016,
      firstRegDate: "2016/09",
      regNumber: "456 DEF",
      vinCode: "WBA8J110X0K000000",
      fuelType: "Diisel",
      engineVolume: 2.0,
      enginePower: 140,
      gearbox: "Automaat",
      drivenAxle: "Tagavedu",
      odometer: 189500,
      climateControl: "Kliimaautomaatik",
      seats: 5,
      color: "Must",
      condition: "Kasutatud, avariiline",
      vatPercent: 0,
      customAttributes: [{ key: "Kahjustused", value: "Vasak külg, uksed" }],
      startingPrice: 2000,
      reservePrice: 4500,
      auctionEnd: days(5),
      phoneAuctionActive: true,
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
    },
    {
      slug: "toyota-rav4-hybrid",
      title: {
        et: "Toyota RAV4 Hybrid",
        en: "Toyota RAV4 Hybrid",
        ru: "Toyota RAV4 Hybrid",
      },
      description: {
        et: "<p>Kerge tagumine kahjustus. Hübriidajam töökorras, sõiduk liigub omal jõul. Üks omanik, hooldusraamat olemas.</p>",
      },
      make: "Toyota",
      model: "RAV4",
      year: 2021,
      firstRegDate: "2021/06",
      regNumber: "789 GHI",
      vinCode: "JTMW53FV20D000000",
      fuelType: "Hübriid",
      engineVolume: 2.5,
      enginePower: 160,
      gearbox: "Automaat",
      drivenAxle: "4x4",
      odometer: 67800,
      climateControl: "Kliimaautomaatik",
      seats: 5,
      color: "Valge",
      condition: "Kasutatud, kergelt avariiline",
      vatPercent: 24,
      customAttributes: [
        { key: "Kahjustused", value: "Tagastange, tagaluuk" },
        { key: "Ülevaatus kehtib", value: "06/2027" },
      ],
      startingPrice: 8000,
      reservePrice: 14000,
      auctionEnd: days(7),
      phoneAuctionActive: false,
      image:
        "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=1200&q=80",
    },
  ];

  const admin = await db.user.findUnique({
    where: { email: "gertmaeste@gmail.com" },
  });

  let created = 0;
  for (const sample of sampleAuctions) {
    const existing = await db.auction.findUnique({ where: { slug: sample.slug } });
    if (existing) continue;
    await db.auction.create({
      data: {
        slug: sample.slug,
        status: "ACTIVE",
        auctionType: "REGULAR",
        title: sample.title,
        description: sample.description,
        make: sample.make,
        model: sample.model,
        year: sample.year,
        firstRegDate: sample.firstRegDate,
        regNumber: sample.regNumber,
        vinCode: sample.vinCode,
        fuelType: sample.fuelType,
        engineVolume: sample.engineVolume,
        enginePower: sample.enginePower,
        gearbox: sample.gearbox,
        drivenAxle: sample.drivenAxle,
        odometer: sample.odometer,
        climateControl: sample.climateControl,
        seats: sample.seats,
        color: sample.color,
        condition: sample.condition,
        vatPercent: sample.vatPercent,
        customAttributes: sample.customAttributes,
        startingPrice: sample.startingPrice,
        bidIncrement: 100,
        reservePrice: sample.reservePrice,
        auctionStart: now(),
        auctionEnd: sample.auctionEnd,
        phoneAuctionActive: sample.phoneAuctionActive,
        createdBy: admin!.id,
        images: {
          create: [
            {
              url: sample.image,
              alt: `${sample.make} ${sample.model}`,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    created++;
  }
  log.push(`Sample auctions (${created} created)`);

  return log;
}
