import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogbookSummary {
  driver_name: string;
  ppsn: string;
  vehicle_registration: string;
  total_km_business: number | string;
  business_percent: number | string;
  total_running_costs: number;
  fuel_eur: number | string;
  insurance_eur: number | string;
  motor_tax_eur: number | string;
  repairs_maintenance_eur: number | string;
  nct_testing_eur: number | string;
  other_eur: number | string;
  car_cost_eur: number | string;
  co2_band: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const summary: LogbookSummary = await req.json();
    
    console.log("Sending logbook summary email for:", summary.driver_name);

    const businessKm = Number(summary.total_km_business) || 0;
    const businessPercent = Number(summary.business_percent) || 0;
    const fuelCost = Number(summary.fuel_eur) || 0;
    const insuranceCost = Number(summary.insurance_eur) || 0;
    const motorTaxCost = Number(summary.motor_tax_eur) || 0;
    const repairsCost = Number(summary.repairs_maintenance_eur) || 0;
    const nctCost = Number(summary.nct_testing_eur) || 0;
    const otherCost = Number(summary.other_eur) || 0;
    
    const totalRunningCosts = fuelCost + insuranceCost + motorTaxCost + repairsCost + nctCost + otherCost;
    const deductibleRunningCosts = totalRunningCosts * (businessPercent / 100);

    const emailResponse = await resend.emails.send({
      from: "Nexus Ventures Logbook <onboarding@resend.dev>",
      to: ["jesus@irishtaxagents.com"],
      subject: `Logbook Summary - ${summary.driver_name} (${summary.vehicle_registration})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
            Business Mileage Logbook Summary
          </h1>
          
          <h2 style="color: #2d3748; margin-top: 30px;">Client Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Driver Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${summary.driver_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>PPSN:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${summary.ppsn}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle Registration:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${summary.vehicle_registration}</td>
            </tr>
          </table>

          <h2 style="color: #2d3748; margin-top: 30px;">Income Tax Declaration Data</h2>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a365d; margin-top: 0;">Business Mileage</h3>
            <p style="font-size: 18px; margin: 10px 0;">
              <strong>Total Business KM:</strong> ${businessKm.toLocaleString()} km
            </p>
            <p style="font-size: 18px; margin: 10px 0;">
              <strong>Business Use %:</strong> ${businessPercent}%
            </p>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a365d; margin-top: 0;">Running Costs Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">Fuel:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${fuelCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">Insurance:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${insuranceCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">Motor Tax:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${motorTaxCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">Repairs & Maintenance:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${repairsCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">NCT Testing:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${nctCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0;">Other Costs:</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e0; text-align: right;">€${otherCost.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; background-color: #e2e8f0;">
                <td style="padding: 12px;">Total Running Costs:</td>
                <td style="padding: 12px; text-align: right;">€${totalRunningCosts.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; color: #1a365d;">
                <td style="padding: 12px;">Deductible Amount (${businessPercent}%):</td>
                <td style="padding: 12px; text-align: right; font-size: 18px;">€${deductibleRunningCosts.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a365d; margin-top: 0;">Capital Allowances</h3>
            <p style="margin: 10px 0;">
              <strong>Vehicle Cost:</strong> €${Number(summary.car_cost_eur || 0).toFixed(2)}
            </p>
            <p style="margin: 10px 0;">
              <strong>CO₂ Band:</strong> ${summary.co2_band || 'Not specified'}
            </p>
            <p style="font-size: 12px; color: #718096; margin-top: 15px;">
              Note: Capital allowances calculation depends on CO₂ emissions and should be verified according to current Revenue guidelines.
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #718096; font-size: 12px;">
            <p>This summary is automatically generated from the Business Mileage Logbook system.</p>
            <p>Generated on: ${new Date().toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-logbook-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
