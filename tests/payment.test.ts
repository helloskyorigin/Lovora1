import test from "node:test";
import assert from "node:assert/strict";
import {assertProduct,validPayment,type DodoPayment} from "../lib/payments/validation";

const productId="pdt_DEMO123";
const configured={product_id:productId,is_recurring:false,price:{type:"one_time_price",currency:"INR",price:29900,tax_inclusive:true}};
const order={id:"00000000-0000-0000-0000-000000000123",email:"buyer@example.com",sessionId:"cks_DEMO",paymentId:""};
const settled:DodoPayment={payment_id:"pay_DEMO",checkout_session_id:order.sessionId,status:"succeeded",currency:"INR",total_amount:29900,
 metadata:{lovora_order_id:order.id},product_cart:[{product_id:productId,quantity:1}],customer:{email:order.email}};
test("merchant product has the expected one-time INR 299 price",()=>{
 assert.doesNotThrow(()=>assertProduct(configured,productId));
});
test("rejects product with a wrong price, currency, recurring plan or excluded tax",()=>{
 for(const product of [
  {...configured,price:{...configured.price,price:35000}},
  {...configured,price:{...configured.price,currency:"USD"}},
  {...configured,is_recurring:true},
  {...configured,price:{...configured.price,tax_inclusive:false}},
 ]){
  assert.throws(()=>assertProduct(product,productId),/PRICE_MISMATCH/);
 }
});
test("accepts a verified settled checkout",()=>{
 assert.equal(validPayment(settled,order,productId),true);
});
test("refuses to accept nonmatching payment data",()=>{
 const changes:DodoPayment[]=[
  {...settled,status:"processing"},
  {...settled,total_amount:30000},
  {...settled,currency:"USD"},
  {...settled,metadata:{lovora_order_id:"different"}},
  {...settled,checkout_session_id:"cks_WRONG"},
  {...settled,customer:{email:"different@example.com"}},
  {...settled,product_cart:[{product_id:"pdt_WRONG",quantity:1}]},
  {...settled,product_cart:[{product_id:productId,quantity:2}]},
  {...settled,refund_status:"full"},
 ];
 for(const candidate of changes)assert.equal(validPayment(candidate,order,productId),false);
});
test("payment identity is unique per purchase",()=>{
 assert.equal(validPayment(settled,{...order,paymentId:"pay_OTHER"},productId),false);
});
