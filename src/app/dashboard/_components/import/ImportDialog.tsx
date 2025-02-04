"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { readCSVFile, parseFinancialCSV } from "./fileParse";

export function ImportDialog() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      const parsed = await readCSVFile(acceptedFiles[0] as File);
      console.log(parsed);
      setParsed(parsed);
      console.log(parseFinancialCSV(parsed));
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [open, setOpen] = useState(false);

  const pages = [
    <div key="page1">
      <h2 className="text-lg font-semibold mb-2">Page 1</h2>
      <div className="w-full max-w-md mx-auto">
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the CSV file here"
              : "Drag 'n' drop a CSV file here, or click to select one"}
          </p>
        </div>
        {file && (
          <div className="mt-4 text-sm text-gray-600">
            Selected file: {file.name}
          </div>
        )}
      </div>
    </div>,
    <div key="page2">
      <h2 className="text-lg font-semibold mb-2">Page 2</h2>
      <p>Here's the content for page 2.</p>
    </div>,
    <div key="page3">
      <h2 className="text-lg font-semibold mb-2">Page 3</h2>
      <p>And finally, this is page 3.</p>
    </div>,
  ];

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentPage(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import From Splitwise</DialogTitle>
          {/* <DialogDescription>{description}</DialogDescription> */}
        </DialogHeader>
        <div className="py-4">{pages[currentPage]}</div>
        <DialogFooter className="flex justify-between">
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentPage === pages.length - 1}
            >
              Next
            </Button>
          </>

          <Button type="button" variant="destructive" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
