import { supabase } from "./supabase";

export type IssueRow = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: "aberto" | "em_analise" | "resolvido";
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
};

export async function fetchIssues() {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as IssueRow[];
}

export async function createIssue(
  input: Omit<IssueRow, "id" | "created_at" | "user_id">
) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("issues")
    .insert({
      user_id: user.id,
      ...input,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as IssueRow;
}

export async function updateIssueStatus(
  id: string,
  status: IssueRow["status"]
) {
  const { data, error } = await supabase
    .from("issues")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as IssueRow;
}