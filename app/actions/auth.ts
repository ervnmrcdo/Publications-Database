"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { form } from "framer-motion/client"

export const signIn = async (formData: FormData) => {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        return {error: error.message};
    }

    return { success: true }
    // revalidatePath("/", 'layout');
    // redirect("/dashboard");
    
}

export const signUp = async (formData: FormData) => {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
            data: {
                name: formData.get("name") as string,
                // add additional info for form here
            }
        }
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) {
        return {error: error.message};
    }

    return { success: true }
    // revalidatePath("/", 'layout');
    // redirect("/dashboard");
}

export const signOut = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", 'layout');
}