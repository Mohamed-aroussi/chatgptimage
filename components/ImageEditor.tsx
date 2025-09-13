import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon, MagicWandIcon, TrashIcon, DownloadIcon } from './IconComponents';

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [texts, setTexts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError("حجم الملف كبير جدًا. الرجاء اختيار صورة أصغر من 4 ميجابايت.");
        return;
      }
      setError(null);
      setOriginalImageFile(file);
      setEditedImage(null);
      setTexts([]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    setTexts(t => [...t, '']);
  };

  const handleTextChange = (index: number, value: string) => {
    setTexts(t => {
      const newTexts = [...t];
      newTexts[index] = value;
      return newTexts;
    });
  };

  const handleRemoveText = (index: number) => {
    setTexts(t => t.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!originalImage || !prompt || !originalImageFile) {
      setError('الرجاء رفع صورة وكتابة طلب التعديل.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setEditedImage(null);

    try {
        const activeTexts = texts.filter(t => t.trim() !== '');
        let finalPrompt = prompt;
        if (activeTexts.length > 0) {
            const textPrompts = activeTexts.map(t => `"${t}"`).join(', ');
            finalPrompt = `${prompt}. بالإضافة إلى ذلك، قم بإضافة النصوص التالية إلى الصورة: ${textPrompts}`;
        }

        const base64Image = originalImage.split(',')[1];
        const result = await editImage(base64Image, originalImageFile.type, finalPrompt);
        if (result) {
            setEditedImage(`data:image/png;base64,${result}`);
        } else {
            setError('لم يتمكن النموذج من تعديل الصورة. حاول مرة أخرى بطلب مختلف.');
        }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الصورة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-64 md:h-96 bg-gray-800/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-600 text-gray-500">
      <UploadIcon className="w-16 h-16 mb-4" />
      <p className="text-lg">لم يتم عرض أي صورة بعد</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-xl">
        <label htmlFor="image-upload" className="block text-xl font-medium text-indigo-300 mb-3">
          1. ارفع صورتك
        </label>
        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors">
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-400">
              <span className="relative rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none">
                <span>اختر ملفًا</span>
                <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
              </span>
              <p className="pr-1">أو اسحبه وأفلته هنا</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP حتى 4 ميجابايت</p>
          </div>
        </div>
      </div>
      
      {originalImage && (
        <>
          <div className="p-6 bg-gray-800/50 rounded-lg shadow-xl">
            <label htmlFor="prompt" className="block text-xl font-medium text-indigo-300 mb-3">
              2. صف التعديل الذي تريده
            </label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="مثال: أضف قبعة قرصان على رأسه"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg shadow-xl">
            <label className="block text-xl font-medium text-indigo-300 mb-3">
              3. أضف نصوصًا على الصورة (اختياري)
            </label>
            <div className="space-y-3">
              {texts.map((text, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder={`النص ${index + 1}`}
                    className="flex-grow bg-gray-900 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button onClick={() => handleRemoveText(index)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button onClick={handleAddText} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                + إضافة نص آخر
              </button>
            </div>
          </div>
        </>
      )}

      {originalImage && prompt && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
          >
            {isLoading ? <LoadingSpinner /> : <MagicWandIcon />}
            {isLoading ? 'جاري الإنشاء...' : 'حوّل الصورة'}
          </button>
        </div>
      )}
      
      {error && <div className="text-center p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="space-y-2">
          <h3 className="text-center text-xl font-semibold text-gray-300">الصورة الأصلية</h3>
          {originalImage ? <img src={originalImage} alt="Original" className="w-full h-auto rounded-lg object-contain max-h-96" /> : <ImagePlaceholder />}
        </div>
        <div className="space-y-2">
          <h3 className="text-center text-xl font-semibold text-gray-300">الصورة المعدلة</h3>
          {isLoading && <div className="w-full h-64 md:h-96 flex items-center justify-center bg-gray-800/50 rounded-lg"><LoadingSpinner /></div>}
          {!isLoading && (editedImage ? <img src={editedImage} alt="Edited" className="w-full h-auto rounded-lg object-contain max-h-96" /> : <ImagePlaceholder />)}
          {editedImage && !isLoading && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105"
              >
                <DownloadIcon className="w-5 h-5" />
                تحميل الصورة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;