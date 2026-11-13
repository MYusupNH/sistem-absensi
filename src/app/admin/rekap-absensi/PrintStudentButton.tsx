
"use client";

type PrintStudentButtonProps = {
  targetId: string;
};

export default function PrintStudentButton({
  targetId,
}: PrintStudentButtonProps) {
  function handlePrint() {
    const target = document.getElementById(targetId);

    if (!target) {
      alert("Data rekap siswa tidak ditemukan.");
      return;
    }

    const style = document.createElement("style");

    style.id = "print-single-student-style";
    style.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        body.print-single-student * {
          visibility: hidden !important;
        }

        body.print-single-student #${targetId},
        body.print-single-student #${targetId} * {
          visibility: visible !important;
        }

        body.print-single-student #${targetId} {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
        }

        body.print-single-student #${targetId} summary {
          display: flex !important;
        }

        body.print-single-student #${targetId} .print\\:hidden {
          display: none !important;
        }

        body.print-single-student #${targetId} table {
          width: 100% !important;
          border-collapse: collapse !important;
        }

        body.print-single-student #${targetId} th,
        body.print-single-student #${targetId} td {
          border: 1px solid #d1d5db !important;
          padding: 8px !important;
          color: black !important;
        }

        body.print-single-student #${targetId} thead {
          display: table-header-group;
        }

        body.print-single-student #${targetId} tr {
          break-inside: avoid;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.classList.add("print-single-student");

    const cleanup = () => {
      document.body.classList.remove("print-single-student");
      document.getElementById("print-single-student-style")?.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    window.print();

    // Cadangan untuk browser yang tidak memicu afterprint.
    window.setTimeout(cleanup, 1500);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 print:hidden"
    >
      <span aria-hidden="true">🖨</span>
      Cetak Rekap
    </button>
  );
}
