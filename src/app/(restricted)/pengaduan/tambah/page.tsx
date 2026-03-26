"use client";
import { addPengaduan } from "@/app/action";
import {
  InputText,
  ComboboxWithLabel,
  DatePickerWithLable,
  InputTextArea,
} from "@/components/input";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Spinner from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PENGADUAN_OPTIONS } from "@/lib/constants";

const TambahPengaduan = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  // const router = useRouter();
  const [phone, setPhone] = useState("");
  const [selectedPengaduan, setSelectedPengaduan] = useState("");
  const [suspect, setSuspect] = useState("");
  const [reportedAt, setReportedAt] = useState(new Date());
  const [description, setDescription] = useState("");
  const [proof, setProof] = useState("");

  // useEffect(() => {
  //   if (session && session.user) {
  //     getUserByEmail(session.user.email!).then((res) => {
  //       if (res.length === 0) return;
  //     });
  //   }
  // }, [session]);

  if (!session) return <Spinner />;

  const resetInput = () => {
    setDescription("");
    setProof("");
    setSuspect("");
    setSelectedPengaduan("");
  };
  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // if (purpose === "" || organization === "") {
    //   setErrorMessage("Tujuan kedatangan dan organisasi harus terisi");
    //   return;
    // }
    if (
      session.user.email == "" ||
      phone == "" ||
      selectedPengaduan == "" ||
      suspect == "" ||
      !reportedAt ||
      description == "" ||
      proof == ""
    ) {
      toast({
        title: "Harap lengkapi input",
        description: new Date(reportedAt).toLocaleDateString("id-ID"),
      });
      return;
    }
    if (session && session.user) {
      const data = {
        email: session.user.email!,
        phone: phone,
        category: selectedPengaduan,
        suspect: suspect,
        reportedAt: reportedAt,
        description: description,
        proof: proof,
      };
      setLoading(true);
      const success = await addPengaduan(data);
      console.log();

      setTimeout(() => {
        setLoading(false);
        setErrorMessage("");
      });
      // toast({
      //   title: "Pengaduan berhasil ditambahkan",
      //   description: (
      //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      //     </pre>
      //   ),
      // });
      if (success) {
        resetInput();
        toast({
          title: "Pengaduan berhasil ditambahkan",
          description:
            "Terima kasih atas informasi anda. Saran & kritik sangat anda bermanfaat bagi kami",
        });
        // router.push("/pengaduan");
      } else {
        toast({
          title: "Buku tamu berhasil gagal ditambahkan",
          description: new Date(reportedAt).toLocaleDateString("id-ID"),
        });
      }
    }
  };
  return (
    <div className="space-y-4 w-full my-8">
      <div className="m-auto w-11/12 md:w-2/3 lg:w-1/2">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">
            Form Pengaduan
          </CardTitle>
          <h2 className="text-center text-lg">
            BPS Kabupaten Tanjung Jabung Barat
          </h2>
          <p className="text-start text-sm text-red-600">{errorMessage}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <InputText
            label="Email"
            name="email"
            required={true}
            value={session?.user?.email ? session.user.email : ""}
            disabled={true}
          />
          <InputText
            label="No Telp."
            name="phone"
            required={true}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <ComboboxWithLabel
            options={PENGADUAN_OPTIONS}
            label="Jenis Layanan"
            name="Jenis Layanan"
            value={selectedPengaduan}
            onChange={setSelectedPengaduan}
          />
          <DatePickerWithLable
            label="Tanggal Kejadian"
            value={reportedAt}
            onChange={setReportedAt}
            required={true}
          />
          <InputText
            label="ASN yang terlibat"
            name="suspect"
            required={true}
            value={suspect}
            onChange={(e) => setSuspect(e.target.value)}
          />
          <InputTextArea
            label="Deskripsi"
            name="purpose"
            required={true}
            value={description}
            placeholder="Tuliskan laporan Saudara secara singkat"
            onChange={(e) => setDescription(e.target.value)}
          />
          <InputText
            label="Link bukti"
            name="link bukti"
            required={true}
            value={proof}
            onChange={(e) => setProof(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full md:w-1/3 flex gap-2 justify-center ease-in-out"
            onClick={(e) => {
              onSubmit(e);
            }}
            disabled={loading}
          >
            {loading && <Spinner />}
            Submit
          </Button>
        </CardFooter>
      </div>
    </div>
  );
};

export default TambahPengaduan;
