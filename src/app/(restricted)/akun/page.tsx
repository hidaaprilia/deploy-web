"use client";
import { getUserByEmail, updateUserByEmail } from "@/app/action";
import { ComboboxWithLabel, InputText } from "@/components/input";
import { USER } from "@/types/types";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/loading";

const AkunPage = () => {
  const { data: session } = useSession();
  const [user, setUser] = React.useState<USER | null>(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async (email: string) => {
      const temp = await getUserByEmail(email);
      setName(temp[0].name);
      setOrganization(temp[0].organization);
      setUser(temp[0]);
    };
    if (session) {
      fetchUser(session?.user?.email || "");
    }
  }, [session]);
  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!session?.user?.email || !user) return;
    const payload = {
      email: session.user.email,
      name: name,
      organization: organization,
      role: user.role,
    };
    setLoading(true);
    const success = await updateUserByEmail(payload);
    if (success) {
      toast({
        title: "Berhasil",
        description: "Data berhasil diubah",
        duration: 3000,
        // variant: "success",
      });
    } else {
      toast({
        title: "Gagal",
        description: "Data gagal diubah",
        duration: 3000,
        // variant: "destructive",
      });
    }
    setLoading(false);
  };
  return (
    <div className="w-11/12 md:w-8/12 m-auto my-8 space-y-4 md:space-y-8">
      <h1 className="text-primary text-lg md:text-2xl font-medium">Akun</h1>

      {user && (
        <div className="space-y-4 md:max-w-md">
          <InputText
            label={"Email"}
            name={"email"}
            value={user.email}
            disabled={true}
          ></InputText>
          <InputText
            label={"Nama"}
            name={"name"}
            value={name}
            // disabled={true}
            onChange={(e) => setName(e.target.value)}
          ></InputText>
          <ComboboxWithLabel
            label={"Organisasi"}
            name={"organisasi"}
            options={[]}
            value={organization}
            onChange={(e) => setOrganization(e)}
          />
          <Button
            type="submit"
            onClick={onSubmit}
            className="flex items-center gap-2"
          >
            {loading && <Spinner />}
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
};

export default AkunPage;
