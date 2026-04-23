import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Logo from "../assets/logo-painel-vagas.svg";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/hooks/useTheme";

export function JobsHeaderCard() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="w-screen bg-[#004726] dark:bg-[#003318] p-6 -mx-4 md:-mx-8 flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex items-start justify-between w-full md:w-auto">
        <CardTitle className="text-3xl text-white">
          <img src={Logo} alt="Painel de Vagas" className="w-16 md:w-auto" />
        </CardTitle>

        <div className="md:hidden">
          <ThemeToggle
            theme={resolvedTheme}
            onToggle={toggleTheme}
          />
        </div>
      </div>

      <CardDescription className="text-white text-sm md:text-base">
        Leitura automática dos arquivos
        <br />
        XLSX gerados em output.
      </CardDescription>

      <div className="hidden md:block ml-auto self-start mr-8">
        <ThemeToggle
          theme={resolvedTheme}
          onToggle={toggleTheme}
        />
      </div>
    </div>
  );
}
