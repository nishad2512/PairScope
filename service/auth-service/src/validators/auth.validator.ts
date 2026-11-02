import z from "zod";

const emailSchema = z.email("Please enter a valid email address");

export const signupSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(3, "The name should be atleast 3 letters")
            .max(20, "The name should be within 20 letters"),
        email: emailSchema,
        password: z
            .string()
            .min(8)
            .max(64)
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().trim(),
});

export type SignupDTO = z.infer<typeof signupSchema>;

export type LoginDTO = z.infer<typeof loginSchema>;
