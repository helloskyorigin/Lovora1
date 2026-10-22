import { ReportExperience } from "@/components/ReportExperience";
import { sampleReport } from "@/lib/report/sample";
export const metadata={title:"LOVORA — Illustrative Marriage Story Preview",robots:{index:false,follow:false}};
export default function SampleReport(){return <ReportExperience report={sampleReport()} demo/>;}
