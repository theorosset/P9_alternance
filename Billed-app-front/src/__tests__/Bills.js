/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {

	describe("When I am on Bills Page", () => {

		//Test highlight icon
		it("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			// INIT document
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			// INIT router and function onNavigate
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");

			expect(windowIcon.classList.contains("active-icon")).toBe(true);
		});

		// page loading test
		describe("When bills page loading", () => {
			it("Then have loading text on page", () => {
				document.body.innerHTML = BillsUI({ data: [], loading: true });
				expect(screen.getAllByText("Loading...")).toBeTruthy();
			});
		});
    
		// error message test
		describe("When bills page have error", () => {
			it("Then have error message if can't get tickets", () => {
				document.body.innerHTML = BillsUI({ error: "Fail" });
				expect(screen.getAllByTestId("error-message")).toBeTruthy();
			});
		});

		it("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
				)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});
	// click on eye test
	describe("When I click on icon eye", () => {
		it("Should open bill modal", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			$.fn.modal = jest.fn();

			window.onNavigate(ROUTES_PATH.Bills);
			userEvent.click(screen.getAllByTestId("icon-eye")[0]);
			const billUrl = screen.getAllByTestId("icon-eye")[0].getAttribute("data-bill-url");
			const modale = screen.getByTestId("modaleFile");
			expect(modale.querySelector("img").getAttribute("src") === billUrl).toBe(
				true,
			);
			expect(modale).toBeTruthy();
		});
	});
	//click on btn new bill
	describe("when i click on new bill button", () => {
		it("Should navigate to new bills page", () => {
			$.fn.modal = jest.fn();

			document.body.innerHTML = BillsUI({ data: bills });

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const classContainer = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});

			const navigateToForm = jest.fn(classContainer.handleClickNewBill);
			screen.getByTestId("btn-new-bill").addEventListener("click", navigateToForm);
			userEvent.click(screen.getByTestId("btn-new-bill"));
			expect(screen.getByTestId("form-new-bill")).toBeTruthy();
		});
	});
});
// integration test get
describe("Given i am connected as an employee", () => {
	describe("When i naviguate on Bills page", () => {
		describe("When i get list of bills", () => {
			it("Should get Bills ticket", async () => {
				localStorage.setItem("user", JSON.stringify({ type:"Employee" }));
				document.body.innerHTML = "<div id=\"root\"></div>";
				router();
				window.onNavigate(ROUTES_PATH.Bills);  
				//spy store bills function 
				const spy = jest.spyOn(mockStore, "bills");
				//get list bills 
				const bills = await mockStore.bills().list();

				document.body.innerHTML = BillsUI({ data: bills });
        
				expect(spy).toHaveBeenCalled();
				expect(bills.length).toBe(4);
				expect(screen.getByText("test1")).toBeTruthy();
				expect(screen.getByText("test2")).toBeTruthy();
				expect(screen.getByText("test3")).toBeTruthy();
			});
		});
		describe("When i want to get list of bills but i have an error", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills");
				Object.defineProperty(
					window,
					"localStorage",
					{ value: localStorageMock }
				);
				window.localStorage.setItem("user", JSON.stringify({
					type: "Employee",
					email: "a@a"
				}));
				document.body.innerHTML = "<div id=\"root\"></div>";
				router();
			});
			it("should get 404 error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"));
						},
					};
				});
				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);
				expect(screen.getByText(/Erreur 404/)).toBeTruthy();
			});
			it("should get 500 error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"));
						},
					};
				});
				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);
				expect(screen.getByText(/Erreur 500/)).toBeTruthy();
			});
		});
	});
});
