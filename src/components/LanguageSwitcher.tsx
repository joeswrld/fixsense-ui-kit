import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto gap-2 border-none bg-transparent hover:bg-accent">
        <Globe className="h-4 w-4" />
        <SelectValue>
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.flag} {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
