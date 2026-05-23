import { useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Import() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const csvTemplate = `category,difficulty,correct_text,note,tags,xp,punctuation_mode,capitalization_mode
ielts,medium,accommodation,Where to stay,travel;academic,10,ignore,ignore
phrase,easy,How are you doing?,Greeting phrase,greeting;daily,5,strict,ignore
sentence,hard,The committee has decided to postpone the meeting.,Formal sentence,formal;meeting,15,strict,strict`;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx?)$/i)) {
      toast.error('শুধু CSV বা XLSX ফাইল সাপোর্ট করে');
      return;
    }

    setFile(selectedFile);
    setPreview(null);

    // Preview CSV
    if (selectedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0]?.split(',');
        const rows = lines.slice(1, 6).map(line => line.split(','));
        setPreview({ headers, rows, total: lines.length - 1 });
      };
      reader.readAsText(selectedFile);
    } else {
      setPreview({ total: 'Preview not available for XLSX', headers: null, rows: null });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('একটি ফাইল সিলেক্ট করুন');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/import-export/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${res.data.imported || 0}টি আইটেম import হয়েছে!`);
      setFile(null);
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import করতে সমস্যা হয়েছে');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/import-export/export/items', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `items_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export সফল হয়েছে!');
    } catch {
      toast.error('Export করতে সমস্যা হয়েছে');
    } finally {
      setExporting(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(csvTemplate);
    toast.success('Template কপি হয়েছে!');
  };

  return (
    <AdminLayout title="📥 Import / Export">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-brand-navy mb-4">📤 Import Items</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-navy transition">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-3">📁</div>
                <p className="text-sm font-medium text-gray-700">
                  {file ? file.name : 'CSV বা XLSX ফাইল সিলেক্ট করুন'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Click to browse or drag & drop</p>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">✅ {file.name}</p>
                  <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => { setFile(null); setPreview(null); }} className="text-red-400 hover:text-red-600 text-sm">
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Preview */}
            {preview && preview.headers && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({preview.total} rows):
                </h4>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {preview.headers.map((h, i) => (
                          <th key={i} className="px-2 py-1 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {row.map((cell, j) => (
                            <td key={j} className="px-2 py-1 text-gray-700 truncate max-w-[100px]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="btn-primary w-full mt-4 disabled:opacity-50"
            >
              {importing ? '⏳ Importing...' : '📤 Import Now'}
            </button>
          </div>

          {/* Export */}
          <div className="card">
            <h3 className="text-lg font-bold text-brand-navy mb-4">📥 Export Items</h3>
            <p className="text-sm text-gray-600 mb-4">সকল listening items CSV ফরম্যাটে ডাউনলোড করুন।</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary w-full"
            >
              {exporting ? '⏳ Exporting...' : '📥 Export as CSV'}
            </button>
          </div>
        </div>

        {/* CSV Template */}
        <div className="card h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-brand-navy">📋 CSV Template</h3>
            <button onClick={copyTemplate} className="btn-secondary text-xs py-1 px-3">
              📋 Copy
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">নিচের ফরম্যাট অনুসরণ করে CSV ফাইল তৈরি করুন:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono">{csvTemplate}</pre>
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">কলাম বিবরণ:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li><strong>category:</strong> ielts, phrase, sentence, passage</li>
              <li><strong>difficulty:</strong> easy, medium, hard</li>
              <li><strong>correct_text:</strong> সঠিক টেক্সট (আবশ্যক)</li>
              <li><strong>note:</strong> ঐচ্ছিক hint</li>
              <li><strong>tags:</strong> সেমিকোলন দিয়ে আলাদা করুন</li>
              <li><strong>xp:</strong> পয়েন্ট (সংখ্যা)</li>
              <li><strong>punctuation_mode:</strong> ignore বা strict</li>
              <li><strong>capitalization_mode:</strong> ignore বা strict</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
